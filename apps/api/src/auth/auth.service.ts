import { createHash, randomUUID } from 'node:crypto';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import type { AuthUser, LoginRequest, RegisterRequest } from '@app/shared-contracts';
import { Model, Types } from 'mongoose';
import type { Env } from '../config/env.schema';
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL } from './auth-cookies';
import type { AccessTokenPayload } from './jwt-auth.guard';
import { PasswordService } from './password.service';
import {
  REFRESH_TOKEN_TTL_MS,
  RefreshTokenDocument,
  RefreshTokenEntity,
} from './refresh-token.schema';
import { UserDocument, UserEntity } from '../users/user.schema';

export type RefreshTokenPayload = {
  sub: string;
  jti: string;
  typ: 'refresh';
};

export type IssuedAuthTokens = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

function hashJti(jti: string): string {
  return createHash('sha256').update(jti).digest('hex');
}

function toAuthUser(user: UserDocument): AuthUser {
  return {
    id: user._id.toString(),
    email: user.email,
    username: user.username,
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UserEntity.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(RefreshTokenEntity.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async register(dto: RegisterRequest): Promise<IssuedAuthTokens> {
    if (!this.config.get('AUTH_REGISTRATION_ENABLED', { infer: true })) {
      throw new ForbiddenException('Registration is disabled');
    }

    return this.createUserAndSession(dto);
  }

  /** Used by bootstrap-admin CLI (bypasses AUTH_REGISTRATION_ENABLED). */
  async bootstrapAdmin(dto: RegisterRequest): Promise<AuthUser> {
    const existing = await this.userModel.exists({
      $or: [{ email: dto.email.toLowerCase() }, { username: dto.username }],
    });

    if (existing) {
      throw new ConflictException('User with this email or username already exists');
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const user = await this.userModel.create({
      email: dto.email.toLowerCase(),
      username: dto.username,
      passwordHash,
    });

    return toAuthUser(user);
  }

  async login(dto: LoginRequest): Promise<IssuedAuthTokens> {
    const user = await this.userModel.findOne({ username: dto.username }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const valid = await this.passwordService.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    return this.issueSession(user);
  }

  async refresh(refreshToken: string | undefined): Promise<IssuedAuthTokens> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }

    const payload = await this.verifyRefreshToken(refreshToken);
    const jtiHash = hashJti(payload.jti);
    const stored = await this.refreshTokenModel.findOne({ jti: jtiHash }).exec();

    if (!stored || stored.revokedAt || stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Invalid or revoked refresh token');
    }

    stored.revokedAt = new Date();
    await stored.save();

    const user = await this.userModel.findById(stored.userId).exec();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.issueSession(user);
  }

  async logout(options: { accessUserId?: string; refreshToken?: string }): Promise<void> {
    if (options.refreshToken) {
      try {
        const payload = await this.verifyRefreshToken(options.refreshToken);
        await this.refreshTokenModel
          .updateOne(
            { jti: hashJti(payload.jti), revokedAt: { $exists: false } },
            { revokedAt: new Date() },
          )
          .exec();
      } catch {
        // Still clear cookies even if refresh JWT is invalid/expired.
      }
    }

    if (options.accessUserId && !options.refreshToken) {
      await this.refreshTokenModel
        .updateMany(
          {
            userId: new Types.ObjectId(options.accessUserId),
            revokedAt: { $exists: false },
          },
          { revokedAt: new Date() },
        )
        .exec();
    }
  }

  async getMe(userId: string): Promise<AuthUser> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return toAuthUser(user);
  }

  private async createUserAndSession(dto: RegisterRequest): Promise<IssuedAuthTokens> {
    const email = dto.email.toLowerCase();
    const existing = await this.userModel.exists({
      $or: [{ email }, { username: dto.username }],
    });

    if (existing) {
      throw new ConflictException('User with this email or username already exists');
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    let user: UserDocument;

    try {
      user = await this.userModel.create({
        email,
        username: dto.username,
        passwordHash,
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException('User with this email or username already exists');
      }
      throw error;
    }

    return this.issueSession(user);
  }

  private async issueSession(user: UserDocument): Promise<IssuedAuthTokens> {
    const userId = user._id.toString();
    const jti = randomUUID();
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, typ: 'access' } satisfies AccessTokenPayload,
      {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
        expiresIn: ACCESS_TOKEN_TTL,
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, jti, typ: 'refresh' } satisfies RefreshTokenPayload,
      {
        secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
        expiresIn: REFRESH_TOKEN_TTL,
      },
    );

    await this.refreshTokenModel.create({
      jti: hashJti(jti),
      userId: user._id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      createdAt: new Date(),
    });

    return {
      accessToken,
      refreshToken,
      user: toAuthUser(user),
    };
  }

  private async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
      });

      if (payload.typ !== 'refresh' || !payload.sub || !payload.jti) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  );
}

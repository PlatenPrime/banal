import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthUser } from '@app/shared-contracts';
import type { Request, Response } from 'express';
import { API_DEFAULT_VERSION } from '../config/api-versioning';
import type { Env } from '../config/env.schema';
import {
  ACCESS_TOKEN_COOKIE,
  clearAuthCookies,
  REFRESH_TOKEN_COOKIE,
  setAuthCookies,
  type AuthCookieEnv,
} from './auth-cookies';
import { AuthUserResponseDto, LoginRequestDto, RegisterRequestDto } from './auth.dto';
import { AuthService } from './auth.service';
import {
  CurrentUser,
  type AuthRequestUser,
  type AuthenticatedRequest,
} from './current-user.decorator';
import type { AccessTokenPayload } from './jwt-auth.guard';
import { Public } from './public.decorator';

@ApiTags('auth')
@Controller({ path: 'auth', version: API_DEFAULT_VERSION })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<Env, true>,
    private readonly jwtService: JwtService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a platform user (when AUTH_REGISTRATION_ENABLED)' })
  @ApiCreatedResponse({ type: AuthUserResponseDto })
  @ApiForbiddenResponse({ description: 'Registration disabled' })
  async register(
    @Body() dto: RegisterRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthUser> {
    const issued = await this.authService.register(dto);
    setAuthCookies(res, issued, this.cookieEnv());
    return issued.user;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with username and password' })
  @ApiOkResponse({ type: AuthUserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthUser> {
    const issued = await this.authService.login(dto);
    setAuthCookies(res, issued, this.cookieEnv());
    return issued.user;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue new cookies' })
  @ApiOkResponse({ type: AuthUserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid refresh cookie' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<AuthUser> {
    const refreshToken = readCookie(req, REFRESH_TOKEN_COOKIE);
    const issued = await this.authService.refresh(refreshToken);
    setAuthCookies(res, issued, this.cookieEnv());
    return issued.user;
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke refresh session and clear auth cookies' })
  @ApiNoContentResponse({ description: 'Cookies cleared' })
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken = readCookie(req, REFRESH_TOKEN_COOKIE);
    const accessUserId = await this.tryResolveAccessUserId(req);

    await this.authService.logout({ accessUserId, refreshToken });
    clearAuthCookies(res, this.cookieEnv());
  }

  @Get('me')
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE)
  @ApiOperation({ summary: 'Current authenticated user' })
  @ApiOkResponse({ type: AuthUserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access cookie' })
  me(@CurrentUser() user: AuthRequestUser | undefined): Promise<AuthUser> {
    if (!user?.userId) {
      throw new UnauthorizedException('Authentication required');
    }

    return this.authService.getMe(user.userId);
  }

  private cookieEnv(): AuthCookieEnv {
    return {
      NODE_ENV: this.config.get('NODE_ENV', { infer: true }),
      COOKIE_DOMAIN: this.config.get('COOKIE_DOMAIN', { infer: true }),
      AUTH_COOKIE_SAMESITE: this.config.get('AUTH_COOKIE_SAMESITE', { infer: true }),
    };
  }

  private async tryResolveAccessUserId(req: AuthenticatedRequest): Promise<string | undefined> {
    const accessToken = readCookie(req, ACCESS_TOKEN_COOKIE);
    if (!accessToken) {
      return undefined;
    }

    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(accessToken, {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      });
      return payload.typ === 'access' ? payload.sub : undefined;
    } catch {
      return undefined;
    }
  }
}

function readCookie(req: Request, name: string): string | undefined {
  const cookies = (req as AuthenticatedRequest).cookies;
  const value = cookies?.[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

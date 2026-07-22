import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const APP_REFRESH_TOKENS_COLLECTION = 'a_refresh_tokens';

/** Refresh JWT lifetime — keep cookie maxAge / JWT exp aligned. */
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Schema({ collection: APP_REFRESH_TOKENS_COLLECTION, timestamps: false, versionKey: false })
export class RefreshTokenEntity {
  /** SHA-256 hash of the refresh JWT `jti` (raw jti is never stored). */
  @Prop({ required: true, unique: true })
  jti!: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'UserEntity' })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ required: true, default: () => new Date() })
  createdAt!: Date;

  @Prop()
  revokedAt?: Date;
}

export type RefreshTokenDocument = HydratedDocument<RefreshTokenEntity>;
export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshTokenEntity);

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

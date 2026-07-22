import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export const APP_USERS_COLLECTION = 'a_users';

@Schema({ collection: APP_USERS_COLLECTION, timestamps: true, versionKey: false })
export class UserEntity {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, unique: true, trim: true })
  username!: string;

  @Prop({ required: true })
  passwordHash!: string;
}

export type UserDocument = HydratedDocument<UserEntity>;
export const UserSchema = SchemaFactory.createForClass(UserEntity);

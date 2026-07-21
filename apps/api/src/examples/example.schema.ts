import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export const FOUNDATION_EXAMPLES_COLLECTION = '_foundation_examples';

@Schema({ collection: FOUNDATION_EXAMPLES_COLLECTION, timestamps: false, versionKey: false })
export class ExampleEntity {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, default: () => new Date() })
  createdAt!: Date;
}

export type ExampleDocument = HydratedDocument<ExampleEntity>;
export const ExampleSchema = SchemaFactory.createForClass(ExampleEntity);

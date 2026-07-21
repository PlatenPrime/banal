import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { LegacyExampleWriteDocument } from '../compat/legacy-types/example.document';
import { ExampleDocument, ExampleEntity } from './example.schema';

@Injectable()
export class ExampleRepository {
  constructor(
    @InjectModel(ExampleEntity.name)
    private readonly exampleModel: Model<ExampleDocument>,
  ) {}

  async findAll(): Promise<ExampleDocument[]> {
    return this.exampleModel.find().sort({ createdAt: -1 }).exec();
  }

  async create(writeDoc: LegacyExampleWriteDocument): Promise<ExampleDocument> {
    return this.exampleModel.create(writeDoc);
  }
}

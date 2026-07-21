import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExampleRepository } from './example.repository';
import { ExampleEntity, ExampleSchema } from './example.schema';
import { ExamplesController } from './example.controller';
import { ExamplesService } from './example.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: ExampleEntity.name, schema: ExampleSchema }])],
  controllers: [ExamplesController],
  providers: [ExamplesService, ExampleRepository],
  exports: [ExamplesService],
})
export class ExamplesModule {}

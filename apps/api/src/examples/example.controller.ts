import { Body, Controller, Get, Post } from '@nestjs/common';
import type { ExampleListResponse } from '@app/shared-contracts';
import { CreateExampleDto } from './create-example.dto';
import { ExamplesService } from './example.service';

@Controller({ path: 'examples', version: '1' })
export class ExamplesController {
  constructor(private readonly examplesService: ExamplesService) {}

  @Get()
  findAll(): ExampleListResponse {
    return this.examplesService.findAll();
  }

  @Post()
  create(@Body() dto: CreateExampleDto): never {
    return this.examplesService.create(dto);
  }
}

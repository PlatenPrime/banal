import { Body, Controller, Get, Post } from '@nestjs/common';
import type { ExampleListResponse } from '@app/shared-contracts';
import { API_DEFAULT_VERSION } from '../config/api-versioning';
import { CreateExampleDto } from './create-example.dto';
import { ExamplesService } from './example.service';

@Controller({ path: 'examples', version: API_DEFAULT_VERSION })
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

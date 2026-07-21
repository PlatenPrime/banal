import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import type { ExampleDto, ExampleListResponse } from '@app/shared-contracts';
import { API_DEFAULT_VERSION } from '../config/api-versioning';
import { CreateExampleDto } from './create-example.dto';
import { ExamplesService } from './example.service';

@Controller({ path: 'examples', version: API_DEFAULT_VERSION })
export class ExamplesController {
  constructor(private readonly examplesService: ExamplesService) {}

  @Get()
  findAll(): Promise<ExampleListResponse> {
    return this.examplesService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateExampleDto): Promise<ExampleDto> {
    return this.examplesService.create(dto);
  }
}

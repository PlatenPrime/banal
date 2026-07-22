import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { ExampleDto, ExampleListResponse } from '@app/shared-contracts';
import { Public } from '../auth/public.decorator';
import { API_DEFAULT_VERSION } from '../config/api-versioning';
import { CreateExampleDto } from './create-example.dto';
import { ExampleListResponseDto, ExampleResponseDto } from './example-response.dto';
import { ExamplesService } from './example.service';

@ApiTags('examples')
@Controller({ path: 'examples', version: API_DEFAULT_VERSION })
export class ExamplesController {
  constructor(private readonly examplesService: ExamplesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List foundation examples' })
  @ApiOkResponse({ type: ExampleListResponseDto })
  findAll(): Promise<ExampleListResponse> {
    return this.examplesService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a foundation example (authenticated)' })
  @ApiCreatedResponse({ type: ExampleResponseDto })
  @ApiUnauthorizedResponse({ description: 'Access cookie required' })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed (RFC 9457)' })
  create(@Body() dto: CreateExampleDto): Promise<ExampleDto> {
    return this.examplesService.create(dto);
  }
}

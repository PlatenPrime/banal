import { Controller, Get } from '@nestjs/common';
import type { ExampleListResponse } from '@app/shared-contracts';
import { ExamplesService } from './example.service';

@Controller({ path: 'examples', version: '1' })
export class ExamplesController {
  constructor(private readonly examplesService: ExamplesService) {}

  @Get()
  findAll(): ExampleListResponse {
    return this.examplesService.findAll();
  }
}

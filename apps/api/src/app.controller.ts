import { Controller, Get } from '@nestjs/common';
import { API_DEFAULT_VERSION } from './config/api-versioning';
import { AppService } from './app.service';

@Controller({ path: '', version: API_DEFAULT_VERSION })
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

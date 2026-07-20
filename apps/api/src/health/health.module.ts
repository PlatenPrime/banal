import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { StubMongoHealthIndicator } from './stub-mongo.health-indicator';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [StubMongoHealthIndicator],
})
export class HealthModule {}

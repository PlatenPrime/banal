import { Injectable } from '@nestjs/common';
import { HealthIndicator, type HealthIndicatorResult } from '@nestjs/terminus';

export const STUB_MONGO_NOT_CONFIGURED = 'MongoDB not configured';

/**
 * Placeholder readiness indicator until MongooseModule lands in step 050.
 * Always reports mongodb as down so `/health/ready` returns 503.
 */
@Injectable()
export class StubMongoHealthIndicator extends HealthIndicator {
  isHealthy(key: string): HealthIndicatorResult {
    return this.getStatus(key, false, { message: STUB_MONGO_NOT_CONFIGURED });
  }
}

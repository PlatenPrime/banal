import { Injectable } from '@nestjs/common';
import { SHARED_CONTRACTS_READY } from '@app/shared-contracts';

@Injectable()
export class AppService {
  getHello(): string {
    return SHARED_CONTRACTS_READY ? 'Hello World!' : 'contracts missing';
  }
}

import { SHARED_CONTRACTS_READY } from '@app/shared-contracts';
import { describe, expect, it } from 'vitest';
import { Route } from './routes/index';

describe('index route', () => {
  it('exports a file route module', () => {
    expect(Route).toBeDefined();
    expect(Route.options.component).toBeTypeOf('function');
  });

  it('imports shared contracts', () => {
    expect(SHARED_CONTRACTS_READY).toBe(true);
  });
});

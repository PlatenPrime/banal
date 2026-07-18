import { describe, expect, it } from 'vitest';
import { SHARED_CONTRACTS_READY } from './index';

describe('shared-contracts placeholder', () => {
  it('exports SHARED_CONTRACTS_READY', () => {
    expect(SHARED_CONTRACTS_READY).toBe(true);
  });
});

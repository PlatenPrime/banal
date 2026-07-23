import { describe, expect, it } from 'vitest';
import { parseAllowLegacyWriteFlags } from './allow-legacy-write';

describe('parseAllowLegacyWriteFlags', () => {
  it('defaults missing collections to false via empty map', () => {
    const flags = parseAllowLegacyWriteFlags({});
    expect(flags.size).toBe(0);
    expect(flags.get('users')).toBeUndefined();
  });

  it('parses true / 1 / TRUE as allowed', () => {
    const flags = parseAllowLegacyWriteFlags({
      ALLOW_LEGACY_WRITE_users: 'true',
      ALLOW_LEGACY_WRITE_orders: '1',
      ALLOW_LEGACY_WRITE_items: 'TRUE',
    });

    expect(flags.get('users')).toBe(true);
    expect(flags.get('orders')).toBe(true);
    expect(flags.get('items')).toBe(true);
  });

  it('parses false / 0 / garbage / empty as forbidden', () => {
    const flags = parseAllowLegacyWriteFlags({
      ALLOW_LEGACY_WRITE_users: 'false',
      ALLOW_LEGACY_WRITE_orders: '0',
      ALLOW_LEGACY_WRITE_items: 'yes',
      ALLOW_LEGACY_WRITE_cart: '',
      ALLOW_LEGACY_WRITE_notes: undefined,
    });

    expect(flags.get('users')).toBe(false);
    expect(flags.get('orders')).toBe(false);
    expect(flags.get('items')).toBe(false);
    expect(flags.get('cart')).toBe(false);
    expect(flags.get('notes')).toBe(false);
  });

  it('normalizes collection keys to lowercase', () => {
    const flags = parseAllowLegacyWriteFlags({
      ALLOW_LEGACY_WRITE_Users: 'true',
      ALLOW_LEGACY_WRITE_ORDERS: 'false',
    });

    expect(flags.get('users')).toBe(true);
    expect(flags.get('orders')).toBe(false);
    expect(flags.has('Users')).toBe(false);
  });

  it('ignores unrelated env keys and empty collection suffix', () => {
    const flags = parseAllowLegacyWriteFlags({
      AUTH_REGISTRATION_ENABLED: 'true',
      ALLOW_LEGACY_WRITE_: 'true',
      NODE_ENV: 'test',
    });

    expect(flags.size).toBe(0);
  });

  it('supports multiple collection flags in one env', () => {
    const flags = parseAllowLegacyWriteFlags({
      ALLOW_LEGACY_WRITE_users: 'false',
      ALLOW_LEGACY_WRITE_products: 'true',
    });

    expect(flags.get('users')).toBe(false);
    expect(flags.get('products')).toBe(true);
    expect(flags.get('unknown')).toBeUndefined();
  });
});

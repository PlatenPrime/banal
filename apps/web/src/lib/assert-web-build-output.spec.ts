import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  assertWebBuildOutput,
  requiredWebBuildPaths,
  resolveWebBuildTarget,
} from './assert-web-build-output';

describe('resolveWebBuildTarget', () => {
  it('returns vercel when VERCEL=1', () => {
    expect(resolveWebBuildTarget({ VERCEL: '1' })).toBe('vercel');
  });

  it('returns vercel when VERCEL=true', () => {
    expect(resolveWebBuildTarget({ VERCEL: 'true' })).toBe('vercel');
  });

  it('returns nitro when VERCEL is unset', () => {
    expect(resolveWebBuildTarget({})).toBe('nitro');
  });

  it('returns nitro when VERCEL is empty or 0', () => {
    expect(resolveWebBuildTarget({ VERCEL: '' })).toBe('nitro');
    expect(resolveWebBuildTarget({ VERCEL: '0' })).toBe('nitro');
  });
});

describe('requiredWebBuildPaths', () => {
  it('lists required nitro paths by default', () => {
    expect(requiredWebBuildPaths()).toEqual(['.output/server/index.mjs', '.output/public']);
  });

  it('lists required nitro paths when target is nitro', () => {
    expect(requiredWebBuildPaths('nitro')).toEqual(['.output/server/index.mjs', '.output/public']);
  });

  it('lists required vercel Build Output API paths', () => {
    expect(requiredWebBuildPaths('vercel')).toEqual([
      '.vercel/output/config.json',
      '.vercel/output/static',
    ]);
  });
});

describe('assertWebBuildOutput', () => {
  let tempRoot: string;

  afterEach(() => {
    if (tempRoot) {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('passes when nitro server entry and public dir exist', () => {
    tempRoot = mkdtempSync(path.join(tmpdir(), 'web-build-smoke-'));
    mkdirSync(path.join(tempRoot, '.output/server'), { recursive: true });
    mkdirSync(path.join(tempRoot, '.output/public'), { recursive: true });
    writeFileSync(path.join(tempRoot, '.output/server/index.mjs'), 'export {}\n');

    expect(() => assertWebBuildOutput(tempRoot, 'nitro')).not.toThrow();
  });

  it('throws when nitro server entry is missing and mentions target', () => {
    tempRoot = mkdtempSync(path.join(tmpdir(), 'web-build-smoke-'));
    mkdirSync(path.join(tempRoot, '.output/public'), { recursive: true });

    expect(() => assertWebBuildOutput(tempRoot, 'nitro')).toThrow(
      /missing \.output\/server\/index\.mjs.*target=nitro/,
    );
  });

  it('passes when vercel config.json and static dir exist', () => {
    tempRoot = mkdtempSync(path.join(tmpdir(), 'web-build-smoke-'));
    mkdirSync(path.join(tempRoot, '.vercel/output/static'), { recursive: true });
    writeFileSync(path.join(tempRoot, '.vercel/output/config.json'), '{}\n');

    expect(() => assertWebBuildOutput(tempRoot, 'vercel')).not.toThrow();
  });

  it('throws when vercel config.json is missing and mentions target', () => {
    tempRoot = mkdtempSync(path.join(tmpdir(), 'web-build-smoke-'));
    mkdirSync(path.join(tempRoot, '.vercel/output/static'), { recursive: true });

    expect(() => assertWebBuildOutput(tempRoot, 'vercel')).toThrow(
      /missing \.vercel\/output\/config\.json.*target=vercel/,
    );
  });

  it('resolves target from env when omitted', () => {
    tempRoot = mkdtempSync(path.join(tmpdir(), 'web-build-smoke-'));
    mkdirSync(path.join(tempRoot, '.vercel/output/static'), { recursive: true });
    writeFileSync(path.join(tempRoot, '.vercel/output/config.json'), '{}\n');

    const previous = process.env.VERCEL;
    process.env.VERCEL = '1';
    try {
      expect(() => assertWebBuildOutput(tempRoot)).not.toThrow();
    } finally {
      if (previous === undefined) {
        delete process.env.VERCEL;
      } else {
        process.env.VERCEL = previous;
      }
    }
  });
});

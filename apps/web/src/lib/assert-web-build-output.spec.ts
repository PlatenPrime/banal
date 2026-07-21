import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { assertWebBuildOutput, requiredWebBuildPaths } from './assert-web-build-output';

describe('assertWebBuildOutput', () => {
  let tempRoot: string;

  afterEach(() => {
    if (tempRoot) {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('lists required nitro/public paths', () => {
    expect(requiredWebBuildPaths()).toEqual(['.output/server/index.mjs', '.output/public']);
  });

  it('passes when nitro server entry and public dir exist', () => {
    tempRoot = mkdtempSync(path.join(tmpdir(), 'web-build-smoke-'));
    mkdirSync(path.join(tempRoot, '.output/server'), { recursive: true });
    mkdirSync(path.join(tempRoot, '.output/public'), { recursive: true });
    writeFileSync(path.join(tempRoot, '.output/server/index.mjs'), 'export {}\n');

    expect(() => assertWebBuildOutput(tempRoot)).not.toThrow();
  });

  it('throws when server entry is missing', () => {
    tempRoot = mkdtempSync(path.join(tmpdir(), 'web-build-smoke-'));
    mkdirSync(path.join(tempRoot, '.output/public'), { recursive: true });

    expect(() => assertWebBuildOutput(tempRoot)).toThrow(/missing \.output\/server\/index\.mjs/);
  });
});

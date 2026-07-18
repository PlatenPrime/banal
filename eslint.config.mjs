import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.nx/**',
      '**/coverage/**',
      '**/*.tsbuildinfo',
      'package-lock.json',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: [
      'apps/api/**/*.ts',
      'apps/web/**/*.{ts,tsx}',
      'libs/shared-contracts/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    ignores: ['apps/web/src/routeTree.gen.ts', 'apps/web/.output/**'],
  },
  eslintConfigPrettier,
);

// Shared flat-config base. Apps extend this and add their own rules.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export const ignores = {
  ignores: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/coverage/**',
    '**/*.config.{js,mjs,cjs}',
  ],
};

/** Rules that protect the spec's money and tenancy guarantees everywhere. */
export const guardrails = {
  rules: {
    // ARCH-008: money must never touch JS floating point. parseFloat/Number on an
    // amount is the single most likely way that rule gets broken by accident.
    'no-restricted-globals': [
      'error',
      { name: 'parseFloat', message: 'ARCH-008: use money()/toDecimal() from @fa/contracts, never parseFloat.' },
    ],
    'no-restricted-properties': [
      'error',
      { object: 'Math', property: 'round', message: 'ARCH-008: use decimal rounding from @fa/contracts/money.' },
      { object: 'Number', property: 'parseFloat', message: 'ARCH-008: use money() from @fa/contracts.' },
    ],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'inline-type-imports' }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    'no-console': ['error', { allow: ['warn', 'error'] }],
  },
};

export default tseslint.config(
  ignores,
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  guardrails,
);

import { FlatCompat } from '@eslint/eslintrc';
import { guardrails, ignores } from '@fa/config/eslint.base.mjs';
import tseslint from 'typescript-eslint';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
export default tseslint.config(
  ignores,
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  { rules: { ...guardrails.rules, '@typescript-eslint/no-floating-promises': 'off', '@typescript-eslint/no-misused-promises': 'off', 'no-console': ['error', { allow: ['warn', 'error'] }] } },
);

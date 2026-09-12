import base from '@fa/config/eslint.base.mjs';
export default [
  ...base,
  {
    languageOptions: { parserOptions: { project: ['./tsconfig.json'], tsconfigRootDir: import.meta.dirname } },
  },
  {
    files: ['migrations/**', 'seeds/**'],
    rules: { 'no-console': 'off' },
  },
];

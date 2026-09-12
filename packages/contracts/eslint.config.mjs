import base from '@fa/config/eslint.base.mjs';
export default [
  ...base,
  {
    languageOptions: { parserOptions: { project: ['./tsconfig.test.json'], tsconfigRootDir: import.meta.dirname } },
  },
];

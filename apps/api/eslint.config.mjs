import base from '@fa/config/eslint.base.mjs';
export default [
  ...base,
  {
    languageOptions: {
      parserOptions: { project: ['./tsconfig.json'], tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    // Story 3.3: "No VAT rate literal is allowed in InvoiceService." Rates come from TaxRulesModule.
    files: ['src/modules/invoicing/**', 'src/modules/expenses/**', 'src/modules/payments/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=0.19]',
          message: 'Story 3.3: VAT rate literals are forbidden here — use TaxRulesService.',
        },
        {
          selector: 'Literal[value=0.07]',
          message: 'Story 3.3: VAT rate literals are forbidden here — use TaxRulesService.',
        },
        {
          selector: "Literal[value='0.19']",
          message: 'Story 3.3: VAT rate literals are forbidden here.',
        },
        {
          selector: "Literal[value='0.1900']",
          message: 'Story 3.3: VAT rate literals are forbidden here.',
        },
        {
          selector: "Literal[value='0.07']",
          message: 'Story 3.3: VAT rate literals are forbidden here.',
        },
        {
          selector: "Literal[value='0.0700']",
          message: 'Story 3.3: VAT rate literals are forbidden here.',
        },
      ],
    },
  },
  {
    files: ['src/**/__tests__/**', 'test/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      'no-restricted-syntax': 'off',
    },
  },
];

/**
 * Machine-checked architecture rules for apps/api (ARCH-002, ARCH-003, ARCH-007).
 * Run: pnpm arch   — also executed as a Jest test in CI.
 */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-cross-module-internals',
      comment: 'ARCH-007: a module may import another module ONLY through its index.ts barrel. internal/ and domain/ are module-private.',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/' },
      to: { path: '^src/modules/([^/]+)/(internal|domain|dto|mappers)/', pathNot: '^src/modules/$1/' },
    },
    {
      name: 'no-deep-module-imports',
      comment: 'ARCH-007: other modules and the composition root import a module only via its barrel index.ts.',
      severity: 'error',
      from: { path: '^src/(modules/([^/]+)|composition-root\\.ts|app\\.ts|main\\.ts)' },
      to: { path: '^src/modules/([^/]+)/(?!index\\.ts$).+', pathNot: ['^src/modules/$2/'] },
    },
    {
      name: 'no-knex-outside-repositories',
      comment: 'ARCH-002/006: Knex is only touched by repositories (internal/*.repository.ts), core/, infra/, and the test harness.',
      severity: 'error',
      from: { path: '^src/modules/', pathNot: ['\\.repository\\.ts$', '/__tests__/'] },
      to: { path: '^node_modules/knex', dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'no-blob-sdk-outside-documents',
      comment: 'ARCH-003 / §9.8: only DocumentsModule (via DocumentStoragePort in infra/) touches blob storage.',
      severity: 'error',
      from: { path: '^src/modules/' },
      to: { path: '^node_modules/@aws-sdk/' },
    },
    {
      name: 'no-infra-from-modules',
      comment: 'Modules depend on core/ports interfaces; concrete adapters are injected by the composition root.',
      severity: 'error',
      from: { path: '^src/modules/' },
      to: { path: '^src/infra/' },
    },
    {
      name: 'domain-is-pure',
      comment: 'domain/ contains pure functions: no knex, no ctx, no repositories, no other modules, no infra.',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/domain/' },
      to: {
        path: ['^src/(infra|http|core/unit-of-work|core/scoped-repository)', '^src/modules/[^/]+/(internal|.*\\.service\\.ts)', '^node_modules/(knex|pg|express|bullmq)'],
      },
    },
    {
      name: 'no-queue-sdk-outside-infra',
      severity: 'error',
      from: { path: '^src/modules/' },
      to: { path: '^node_modules/(bullmq|ioredis)' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: { exportsFields: ['exports'], conditionNames: ['import', 'require', 'node', 'default', 'types'] },
    reporterOptions: { text: { highlightFocused: true } },
  },
};

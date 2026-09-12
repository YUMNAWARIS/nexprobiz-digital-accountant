export default async function globalTeardown(): Promise<void> {
  // Leave fa_test in place for post-mortem inspection; global-setup recreates it every run.
}

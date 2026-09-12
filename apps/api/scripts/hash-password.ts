/**
 * Prints an Argon2id hash for the demo seed (SEED_DEMO_PASSWORD_HASH).
 * Usage: pnpm --filter @fa/api hash-password [password]   (default: StrongPassword123!)
 */
import argon2 from 'argon2';

const password = process.argv[2] ?? 'StrongPassword123!';
argon2
  .hash(password, { type: argon2.argon2id })
  .then((h) => process.stdout.write(`${h}\n`))
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  });

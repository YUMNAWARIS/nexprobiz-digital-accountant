/** §18 error contract. Every thrown AppError maps 1:1 to the wire body. */
import { ERROR_CODES, type ErrorCode, type ErrorDetail, SANDBOX } from '@fa/contracts';

export class AppError extends Error {
  readonly status: number;
  constructor(
    readonly code: ErrorCode,
    message?: string,
    readonly details?: ErrorDetail[],
    override readonly cause?: unknown,
  ) {
    super(message ?? code);
    this.name = 'AppError';
    this.status = ERROR_CODES[code];
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id?: string) {
    super('NOT_FOUND', id ? `${entity} ${id} not found.` : `${entity} not found.`);
  }
}
export class ValidationError extends AppError {
  constructor(details: ErrorDetail[], message = 'Validation failed.') {
    super('VALIDATION_FAILED', message, details);
  }
}
export class UnauthorizedError extends AppError {
  constructor(code: ErrorCode = 'UNAUTHORIZED', message = 'Authentication required.') {
    super(code, message);
  }
}
export class ConflictError extends AppError {
  constructor(code: ErrorCode, message: string, details?: ErrorDetail[]) {
    super(code, message, details);
  }
}
/** §4 — "This case is not supported in the sandbox. Please review it manually." */
export class UnsupportedAccountingCaseError extends AppError {
  constructor(detail?: string) {
    super(
      'UNSUPPORTED_ACCOUNTING_CASE',
      SANDBOX.UNSUPPORTED_CASE_MESSAGE,
      detail ? [{ field: 'case', message: detail }] : undefined,
    );
  }
}

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}

/** Map a pg unique-violation to a domain conflict. */
export function rethrowUnique(constraint: string, make: () => AppError) {
  return (e: unknown): never => {
    const err = e as { code?: string; constraint?: string };
    if (err?.code === '23505' && (!constraint || err.constraint === constraint)) throw make();
    throw e;
  };
}

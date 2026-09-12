/**
 * The one fetch wrapper. Bearer auth, §18 error decoding, single-flight refresh on 401,
 * redirect to /login when refresh fails. No money math here (ARCH-004).
 */
import type { ApiErrorBody } from '@fa/contracts';
import { API_V1 } from './env';
import { clearSession, getAccessToken, getRefreshToken, saveSession } from './session';

export class ApiError extends Error {
  constructor(readonly body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
  }
  get code() {
    return this.body.code;
  }
  get status() {
    return this.body.status;
  }
  fieldErrors(): Record<string, string> {
    return Object.fromEntries((this.body.details ?? []).map((d) => [d.field, d.message]));
  }
}

let refreshing: Promise<boolean> | null = null;
async function tryRefresh(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const rt = getRefreshToken();
    if (!rt) return false;
    const r = await fetch(`${API_V1}/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!r.ok) return false;
    saveSession((await r.json()) as { accessToken: string; refreshToken: string });
    return true;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  formData?: FormData;
  query?: Record<string, string | number | boolean | undefined>;
  auth?: boolean;
  raw?: boolean;
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = new URL(`${API_V1}${path}`);
  for (const [k, v] of Object.entries(opts.query ?? {}))
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  const doFetch = () => {
    const headers: Record<string, string> = {};
    if (opts.auth !== false) {
      const t = getAccessToken();
      if (t) headers.authorization = `Bearer ${t}`;
    }
    if (opts.body !== undefined) headers['content-type'] = 'application/json';
    return fetch(url, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.formData ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
      cache: 'no-store',
    });
  };
  let res = await doFetch();
  if (res.status === 401 && opts.auth !== false && (await tryRefresh())) res = await doFetch();
  if (res.status === 401 && opts.auth !== false) {
    clearSession();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login'))
      window.location.assign(`/login?from=${encodeURIComponent(window.location.pathname)}`);
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({
      status: res.status,
      code: 'INTERNAL_ERROR',
      message: res.statusText,
      requestId: res.headers.get('x-request-id') ?? '',
    }))) as ApiErrorBody;
    throw new ApiError(body);
  }
  if (res.status === 204) return undefined as T;
  if (opts.raw) return res as unknown as T;
  return (await res.json()) as T;
}

/** Download a binary endpoint through the API (keeps the bearer header). */
export async function apiDownload(path: string, filename: string): Promise<void> {
  const res = await api<Response>(path, { raw: true });
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

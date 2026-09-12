/**
 * Token storage. Access token (15 min) + refresh token (7 d) in SameSite=Lax cookies so the
 * Next middleware can gate routes on presence. Sandbox scope — see docs/DEVIATIONS.md.
 */
import { deleteCookie, getCookie, setCookie } from './cookies';

export const ACCESS_COOKIE = 'fa_access';
export const REFRESH_COOKIE = 'fa_refresh';
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

export function saveSession(t: { accessToken: string; refreshToken: string }) {
  setCookie(ACCESS_COOKIE, t.accessToken, REFRESH_MAX_AGE); // cookie lives 7d; the JWT itself expires in 15 min and is refreshed
  setCookie(REFRESH_COOKIE, t.refreshToken, REFRESH_MAX_AGE);
}
export function clearSession() {
  deleteCookie(ACCESS_COOKIE);
  deleteCookie(REFRESH_COOKIE);
}
export const getAccessToken = () => getCookie(ACCESS_COOKIE);
export const getRefreshToken = () => getCookie(REFRESH_COOKIE);

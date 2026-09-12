import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC = ['/login', '/register'];
const ACCESS_COOKIE = 'fa_access';

/** Presence gate only; the API verifies the JWT. Expired tokens are refreshed by the api client. */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = Boolean(req.cookies.get(ACCESS_COOKIE)?.value);
  if (PUBLIC.some((p) => pathname.startsWith(p))) {
    return authed ? NextResponse.redirect(new URL('/dashboard', req.url)) : NextResponse.next();
  }
  if (!authed) {
    const url = new URL('/login', req.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

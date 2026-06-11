import { NextResponse } from "next/server";

const LOGIN_REDIRECT_URL = "/login?redirect=dashboard&message=save-readings";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const authToken = request.cookies.get("auth_token")?.value;
  const nextAuthSessionToken = request.cookies.get("next-auth.session-token")?.value;
  const secureNextAuthSessionToken = request.cookies.get("__Secure-next-auth.session-token")?.value;

  const hasJwtSession = Boolean(authToken);
  const hasNextAuthSession = Boolean(nextAuthSessionToken || secureNextAuthSessionToken);

  console.log(`[Middleware] Path: ${pathname}, hasJwtSession: ${hasJwtSession}, hasNextAuthSession: ${hasNextAuthSession}`);
  console.log(`[Middleware] Cookies present:`, request.cookies.getAll().map(c => c.name));

  if (!hasJwtSession && !hasNextAuthSession) {
    console.log(`[Middleware] Redirecting to login from path: ${pathname}`);
    return NextResponse.redirect(new URL(LOGIN_REDIRECT_URL, request.url));
  }

  console.log(`[Middleware] Allowing access to path: ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};

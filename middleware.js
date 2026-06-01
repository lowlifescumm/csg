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

  if (!hasJwtSession && !hasNextAuthSession) {
    return NextResponse.redirect(new URL(LOGIN_REDIRECT_URL, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};

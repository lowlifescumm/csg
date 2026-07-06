import { NextResponse } from "next/server";

const LOGIN_REDIRECT_URL = "/login?redirect=dashboard&message=save-readings";

export function middleware(request) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host") || "";

  // 1. Force canonical non-www domain (cosmicspiritguide.com) for production
  if (host && (host.startsWith("www.") || host.includes("onrender.com"))) {
    const canonicalUrl = new URL(pathname + search, "https://cosmicspiritguide.com");
    return NextResponse.redirect(canonicalUrl, 301);
  }

  // 2. Protect dashboard routes
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
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logos (logos directory)
     * - images (images directory)
     * - manifest.json (manifest file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|logos|images|manifest.json).*)",
  ],
};


import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-config";

const NEXTAUTH_URL = process.env.NEXTAUTH_URL?.trim() || "";

const handler = NextAuth(authOptions);
console.log('[NextAuth] Handler created successfully');

export async function GET(request, context) {
  console.log('[NextAuth][GET] Incoming request', {
    url: request.url,
    host: request.headers.get('host'),
    forwardedHost: request.headers.get('x-forwarded-host'),
    forwardedProto: request.headers.get('x-forwarded-proto'),
    userAgent: request.headers.get('user-agent'),
  });
  // Force public host if request came in via internal service URL
  try {
    const expectedHost = NEXTAUTH_URL ? new URL(NEXTAUTH_URL).host : null;
    const reqUrl = new URL(request.url);
    const incomingHost = request.headers.get('host');
    if (expectedHost && incomingHost && incomingHost !== expectedHost) {
      const redirectUrl = `${NEXTAUTH_URL}${reqUrl.pathname}${reqUrl.search}`;
      console.log('[NextAuth][GET] Host mismatch, redirecting to public host', { incomingHost, expectedHost, redirectUrl });
      return Response.redirect(redirectUrl, 307);
    }
  } catch (e) {
    console.error('[NextAuth][GET] Host enforcement error:', e);
  }
  
  return handler(request, context);
}

export async function POST(request, context) {
  console.log('[NextAuth][POST] Incoming request', {
    url: request.url,
    host: request.headers.get('host'),
    forwardedHost: request.headers.get('x-forwarded-host'),
    forwardedProto: request.headers.get('x-forwarded-proto'),
    userAgent: request.headers.get('user-agent'),
  });
  // Force public host if request came in via internal service URL
  try {
    const expectedHost = NEXTAUTH_URL ? new URL(NEXTAUTH_URL).host : null;
    const reqUrl = new URL(request.url);
    const incomingHost = request.headers.get('host');
    if (expectedHost && incomingHost && incomingHost !== expectedHost) {
      const redirectUrl = `${NEXTAUTH_URL}${reqUrl.pathname}${reqUrl.search}`;
      console.log('[NextAuth][POST] Host mismatch, redirecting to public host', { incomingHost, expectedHost, redirectUrl });
      return Response.redirect(redirectUrl, 307);
    }
  } catch (e) {
    console.error('[NextAuth][POST] Host enforcement error:', e);
  }
  
  return handler(request, context);
}
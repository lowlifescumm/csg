import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-config";
import logger from "@/lib/logger";

const NEXTAUTH_URL = process.env.NEXTAUTH_URL?.trim() || "";

const handler = NextAuth(authOptions);
logger.info('[NextAuth] Handler created successfully');

export async function GET(request, context) {
  logger.info('[NextAuth][GET] Incoming request', {
    url: request.url,
    host: request.headers.get('host'),
    forwardedHost: request.headers.get('x-forwarded-host'),
    forwardedProto: request.headers.get('x-forwarded-proto'),
    userAgent: request.headers.get('user-agent'),
  });
  // Rewrite internal host in request URL to public host to prevent NextAuth redirect loops
  try {
    if (NEXTAUTH_URL) {
      const expectedHost = new URL(NEXTAUTH_URL).host;
      const expectedProto = new URL(NEXTAUTH_URL).protocol;
      const reqUrl = new URL(request.url);
      if (reqUrl.host !== expectedHost) {
        const newUrl = new URL(request.url);
        newUrl.host = expectedHost;
        newUrl.protocol = expectedProto;
        request = new Request(newUrl.toString(), request);
        logger.info('[NextAuth][GET] Rewrote request URL for NextAuth handler:', request.url);
      }
    }
  } catch (e) {
    logger.error('[NextAuth][GET] Request URL rewrite error:', e);
  }

  // Force public host if request came in via internal service URL
  try {
    const expectedHost = NEXTAUTH_URL ? new URL(NEXTAUTH_URL).host : null;
    const reqUrl = new URL(request.url);
    const incomingHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
    if (expectedHost && incomingHost && incomingHost !== expectedHost) {
      const redirectUrl = `${NEXTAUTH_URL}${reqUrl.pathname}${reqUrl.search}`;
      logger.info('[NextAuth][GET] Host mismatch, redirecting to public host', { incomingHost, expectedHost, redirectUrl });
      return Response.redirect(redirectUrl, 307);
    }
  } catch (e) {
    logger.error('[NextAuth][GET] Host enforcement error:', e);
  }
  
  return handler(request, context);
}

export async function POST(request, context) {
  logger.info('[NextAuth][POST] Incoming request', {
    url: request.url,
    host: request.headers.get('host'),
    forwardedHost: request.headers.get('x-forwarded-host'),
    forwardedProto: request.headers.get('x-forwarded-proto'),
    userAgent: request.headers.get('user-agent'),
  });
  // Rewrite internal host in request URL to public host to prevent NextAuth redirect loops
  try {
    if (NEXTAUTH_URL) {
      const expectedHost = new URL(NEXTAUTH_URL).host;
      const expectedProto = new URL(NEXTAUTH_URL).protocol;
      const reqUrl = new URL(request.url);
      if (reqUrl.host !== expectedHost) {
        const newUrl = new URL(request.url);
        newUrl.host = expectedHost;
        newUrl.protocol = expectedProto;
        request = new Request(newUrl.toString(), request);
        logger.info('[NextAuth][POST] Rewrote request URL for NextAuth handler:', request.url);
      }
    }
  } catch (e) {
    logger.error('[NextAuth][POST] Request URL rewrite error:', e);
  }

  // Force public host if request came in via internal service URL
  try {
    const expectedHost = NEXTAUTH_URL ? new URL(NEXTAUTH_URL).host : null;
    const reqUrl = new URL(request.url);
    const incomingHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
    if (expectedHost && incomingHost && incomingHost !== expectedHost) {
      const redirectUrl = `${NEXTAUTH_URL}${reqUrl.pathname}${reqUrl.search}`;
      logger.info('[NextAuth][POST] Host mismatch, redirecting to public host', { incomingHost, expectedHost, redirectUrl });
      return Response.redirect(redirectUrl, 307);
    }
  } catch (e) {
    logger.error('[NextAuth][POST] Host enforcement error:', e);
  }
  
  return handler(request, context);
}
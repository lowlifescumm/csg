import { NextResponse } from 'next/server';

// Same-origin image proxy for Sanity CDN assets.
// Sanity's CDN returns 403 (CORS Origin not allowed) for browser requests from
// cosmicspiritguide.com, which makes browsers block the images via ORB.
// Fetching server-side (no CORS restriction) and streaming back same-origin
// avoids the problem entirely.

const ALLOWED_HOSTS = new Set(['cdn.sanity.io']);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('u');

  if (!target) {
    return NextResponse.json({ error: 'Missing u param' }, { status: 400 });
  }

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // SSRF guard: only allow Sanity CDN hosts over https
  if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname)) {
    return NextResponse.json({ error: 'Disallowed host' }, { status: 403 });
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      // No Origin header so Sanity serves the asset normally
      headers: { Accept: 'image/*,*/*' },
      cache: 'no-store',
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    const contentType = upstream.headers.get('content-type') || 'image/webp';

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 502 });
  }
}

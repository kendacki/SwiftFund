import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/creator')) {
    const privyToken = request.cookies.get('privy-token');
    const ytTokens = request.cookies.get('yt_tokens');

    // Allow access if either:
    // - The user is authenticated with Privy (standard flow), OR
    // - The YouTube OAuth callback just set yt_tokens and is redirecting to /creator.
    if (!privyToken && !ytTokens) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/creator/:path*'],
};


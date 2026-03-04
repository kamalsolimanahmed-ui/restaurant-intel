import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Paths that are always allowed (even for expired trials)
const publicPaths = ['/', '/auth/login', '/auth/signup', '/pricing', '/privacy', '/terms', '/contact', '/upgrade', '/checkout', '/api/auth', '/api/email/test', '/api/checkout', '/api/cron'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path is public
  const isPublicPath = publicPaths.some(path =>
    pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Get the session token
  const sessionToken = request.cookies.get("session")?.value;
  let token: any = null;

  if (sessionToken) {
    try {
      const secret = new TextEncoder().encode(
        process.env.AUTH_SECRET || "fallback-secret-for-development"
      );
      const { payload } = await jwtVerify(sessionToken, secret);
      token = payload;
    } catch (err) {
      // Invalid token
    }
  }

  // If no token, redirect to login
  if (!token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(loginUrl);
  }

  // Check trial status
  const trialEndsAt = token.trialEndsAt ? new Date(token.trialEndsAt as string) : null;
  const isSubscribed = token.subscribed === true;
  const now = new Date();

  // Determine if trial is expired
  const isTrialExpired = trialEndsAt ? (trialEndsAt < now || isNaN(trialEndsAt.getTime())) : true;

  // Trial expired and not subscribed → enforce paywall
  if (isTrialExpired && !isSubscribed) {
    // For API paths, return 403 Forbidden
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Trial expired. Please upgrade to continue using Restaurant Intel.',
          code: 'TRIAL_EXPIRED'
        },
        { status: 403 }
      );
    }

    // For all other protected paths, redirect to the upgrade page
    const upgradeUrl = new URL('/upgrade', request.url);
    if (!upgradeUrl.searchParams.has('reason')) {
      upgradeUrl.searchParams.set('reason', 'trial_expired');
    }
    return NextResponse.redirect(upgradeUrl);
  }

  return NextResponse.next();
}

// Configure which paths to run middleware on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

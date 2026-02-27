import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Paths that are always allowed (even for expired trials)
const publicPaths = ['/', '/auth/login', '/auth/signup', '/pricing', '/privacy', '/terms', '/contact', '/upgrade', '/checkout', '/api/auth', '/api/email/test', '/api/paddle', '/api/cron'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path is public
  const isPublicPath = publicPaths.some(path =>
    pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // If path is not public, it is protected by default.
  // We no longer rely on a hardcoded list of protected paths.

  // Get the session token with fallback secret
  const secret = process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-development-only";
  const token = await getToken({
    req: request,
    secret: secret,
  });

  // If no token, redirect to login
  if (!token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(loginUrl);
  }

  // Check trial status
  // If trialEndsAt is null or invalid, we treat it as expired to strictly enforce the paywall
  const trialEndsAt = token.trialEndsAt ? new Date(token.trialEndsAt as string) : null;
  const isSubscribed = token.subscribed === true;
  const now = new Date();

  // Determine if trial is expired
  // Fallback to true (expired) if trialEndsAt is falsy or invalid
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
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

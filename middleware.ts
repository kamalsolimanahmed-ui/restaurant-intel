import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Paths that require authentication
const protectedPaths = ['/dashboard', '/results', '/api/analyses', '/api/uploads', '/api/parse', '/api/rules', '/api/insights'];

// Paths that are always allowed (even for expired trials)
const publicPaths = ['/', '/auth/login', '/auth/signup', '/pricing', '/privacy', '/terms', '/contact', '/upgrade', '/checkout', '/api/auth', '/api/email/test'];

// Paths that redirect to upgrade when trial expires
const upgradeRedirectPaths = ['/dashboard', '/results'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path is public
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check if path is protected
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!isProtectedPath) {
    return NextResponse.next();
  }

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
  const trialEndsAt = token.trialEndsAt ? new Date(token.trialEndsAt) : null;
  const isSubscribed = token.subscribed === true;
  const now = new Date();

  // Trial expired and not subscribed → redirect to upgrade
  if (trialEndsAt && trialEndsAt < now && !isSubscribed) {
    // Only redirect specific paths to upgrade
    const shouldRedirectToUpgrade = upgradeRedirectPaths.some(path => 
      pathname === path || pathname.startsWith(`${path}/`)
    );

    if (shouldRedirectToUpgrade) {
      const upgradeUrl = new URL('/upgrade', request.url);
      upgradeUrl.searchParams.set('reason', 'trial_expired');
      return NextResponse.redirect(upgradeUrl);
    }
    
    // For API paths, return 403
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

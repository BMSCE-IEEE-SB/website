import { NextResponse, type NextRequest } from 'next/server';
import { REGISTRATION_ONLY_MODE, isLocalhostHost } from '@/config/temporary-launch';

export function middleware(request: NextRequest) {
  // If restrictions are turned off, bypass completely
  if (!REGISTRATION_ONLY_MODE) {
    return NextResponse.next();
  }

  const host = request.headers.get('host') || '';

  // Localhost bypass: entire website works as normal
  if (isLocalhostHost(host) || process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Always allow Next.js static bundles, assets, icons, and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/brand') ||
    pathname.startsWith('/chapter-logos') ||
    pathname.startsWith('/team') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Active registration & membership workflow paths
  const isRegistrationWorkflow =
    pathname.startsWith('/membership/register') ||
    pathname.startsWith('/membership/profile') ||
    pathname.startsWith('/membership/chapters') ||
    pathname.startsWith('/membership/checkout');

  // Member account & verification portal
  const isMemberPortal = pathname.startsWith('/login') || pathname.startsWith('/account');

  // Admin order inspection & receipt issuance
  const isAdmin = pathname.startsWith('/admin');

  // Legal & compliance documentation required for payments
  const isLegalPolicy = pathname === '/terms' || pathname === '/privacy' || pathname === '/refund';

  const isAllowed = isRegistrationWorkflow || isMemberPortal || isAdmin || isLegalPolicy;

  const targetHost = host === 'bmsceieee.com' ? 'www.bmsceieee.com' : host;

  // Any off-limits page (including '/', '/membership', '/chapters/*') redirects to register
  if (!isAllowed) {
    const redirectUrl = new URL('/membership/register', `https://${targetHost}`);
    return NextResponse.redirect(redirectUrl, { status: 307 });
  }

  // Enforce www on production if apex domain accessed
  if (host === 'bmsceieee.com') {
    const redirectUrl = new URL(pathname, 'https://www.bmsceieee.com');
    redirectUrl.search = request.nextUrl.search;
    return NextResponse.redirect(redirectUrl, { status: 301 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

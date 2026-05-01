import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Exact-match routes that redirect logged-in users away (auth-only pages)
const AUTH_ONLY_ROUTES = ['/login', '/signup', '/forgot-password'];

// Routes anyone can access regardless of auth state
const OPEN_ROUTES = [
  '/subscribe',
  '/license',
  '/license/purchase',
  '/license/success',
  '/signup/license',
  '/billing/success',
  '/billing/cancel',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow open routes — no auth check needed
  if (OPEN_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.includes(pathname);

  // Not logged in + trying to access a protected route → redirect to login
  if (!user && !isAuthOnlyRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Logged in + on an auth-only page (login/signup) → redirect to dashboard
  if (user && isAuthOnlyRoute) {
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = '/dashboard';
    return NextResponse.redirect(dashUrl);
  }

  // Subscription status is checked client-side in the dashboard layout
  // (calling the backend from middleware edge runtime adds latency and complexity)

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

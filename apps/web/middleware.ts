import { NextResponse, type NextRequest } from 'next/server';

/** Sans cookie de session, l'espace famille renvoie vers la connexion (la validité est vérifiée par l'API). */
export function middleware(request: NextRequest) {
  if (!request.cookies.has('famille_session')) {
    const url = new URL('/connexion', request.url);
    url.searchParams.set('suite', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/espace-famille/:path*'] };

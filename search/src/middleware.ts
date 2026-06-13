import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hasAuthToken = request.cookies.has("auth_token");
  
  if (!hasAuthToken) {
    const host = request.headers.get("host") || "";
    let loginUrlBase = "http://localhost:3001/login";
    
    if (host.includes("pclub.in")) {
      loginUrlBase = "https://auth.pclub.in/login";
    } else if (host.includes("domain.in")) {
      loginUrlBase = "https://auth.domain.in/login";
    }
    
    const callbackUrl = request.url;
    return NextResponse.redirect(
      new URL(`${loginUrlBase}?callbackUrl=${encodeURIComponent(callbackUrl)}`, request.url)
    );
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except basic Next.js static assets
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
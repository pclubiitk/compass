import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type AdminAuthorization = "admin" | "unauthorized" | "forbidden" | "unavailable";
const AUTHORIZATION_TIMEOUT_MS = 3_000;

async function authorizeAdmin(request: NextRequest): Promise<AdminAuthorization> {
  const authBaseUrl = (
    process.env.AUTH_INTERNAL_URL || process.env.NEXT_PUBLIC_AUTH_URL
  )
    ?.trim()
    .replace(/\/+$/, "");

  if (!authBaseUrl) return "unavailable";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AUTHORIZATION_TIMEOUT_MS);

  try {
    const response = await fetch(`${authBaseUrl}/api/auth/me`, {
      headers: {
        accept: "application/json",
        cookie: request.headers.get("cookie") || "",
      },
      cache: "no-store",
      redirect: "manual",
      signal: controller.signal,
    });

    if (response.status === 401) return "unauthorized";
    if (!response.ok) return "unavailable";

    const data: unknown = await response.json();
    if (!data || typeof data !== "object") return "unavailable";

    const role = (data as { role?: unknown }).role;
    return typeof role === "number" && role >= 100 ? "admin" : "forbidden";
  } catch {
    return "unavailable";
  } finally {
    clearTimeout(timeout);
  }
}

function forbiddenResponse() {
  return new NextResponse("Forbidden", {
    status: 403,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const PUBLIC_PATHS = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/privacy-policy",
  ];

  const ALLOWED_WITHOUT_COOKIES = ["/maps", "/location"];

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  const isAllowedWithoutCookies = ALLOWED_WITHOUT_COOKIES.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  const hasSession =
    request.cookies.has("auth_token") || request.cookies.has("refresh_token");
  const isAdminPath =
    pathname === "/admin" || pathname.startsWith("/admin/");
    
  // console.log("[middleware] request", {
  //   host,
  //   pathname,
  //   isStaticAsset,       
  //   isPublicPath,
  //     isAllowedWithoutCookies,
  //   hasSession,
  // });

  if (isPublicPath || isAllowedWithoutCookies) {
    // console.log("[middleware] allow", { pathname });
    return NextResponse.next();
  }

  if (isAdminPath && hasSession) {
    const authorization = await authorizeAdmin(request);
    if (authorization === "admin") return NextResponse.next();
    if (authorization === "forbidden") return forbiddenResponse();
    if (authorization === "unavailable") {
      return new NextResponse("Authorization service unavailable", {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      });
    }
    // An expired or revoked session follows the normal unauthenticated path.
  }

  if (hasSession && !isAdminPath) {
    // console.log("[middleware] allow-with-session", { pathname });
    return NextResponse.next();
  }

  // console.log("[middleware] block", {
  //   pathname,
  //   redirectTo: "/login",
  //   callbackUrl: request.url,
  // });

  return NextResponse.redirect(
    // TODO: As in prod, due to nginx the request.url will be set to localhost.
    // In Dev:
    // new URL(
    //   `/login?callbackUrl=${encodeURIComponent(request.url)}`,
    //   request.url,
    // ),
    // In Test:
    // new URL("https://bsearch.pclub.in/login")
    // FIXME(Prod): In Prod:
    new URL("https://search.pclub.in/login")
  );
}

export const config = {
  
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files like CSS, JS)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public folder
     * - Any file with a common extension (e.g., logo.png, icon.svg)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|sitemap.xml|robots.txt|.+\\.[\\w]+$).*)',
  ],
};

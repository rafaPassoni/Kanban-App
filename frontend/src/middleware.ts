import { NextResponse, type MiddlewareConfig, type NextRequest } from "next/server";

// Rotas publicas que nao exigem sessao ativa.
const publicRoutes = [
    { path: "/login", whenAuthenticated: "redirect" },
] as const;

// Prefixos publicos uteis para visualizacao sem login (ex.: modo TV).
const publicPrefixes = ["/kanban/tv"] as const;

const REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE = "/login";
const REDIRECT_WHEN_AUTHENTICATED_ROUTE = "/";

function isJwtExpired(token: string | undefined): boolean {
    if (!token) return true;

    try {
        const [, payloadBase64Url] = token.split(".");
        if (!payloadBase64Url) return true;

        const base64 = payloadBase64Url.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

        const payloadJson = atob(padded);
        const payload = JSON.parse(payloadJson) as { exp?: number };

        if (!payload.exp) return true;
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
}

function hasValidSession(accessToken?: string, refreshToken?: string): boolean {
    if (accessToken && !isJwtExpired(accessToken)) return true;
    if (refreshToken && !isJwtExpired(refreshToken)) return true;
    return false;
}

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const search = request.nextUrl.search;
    const publicRoute = publicRoutes.find((route) => route.path === path);
    const isPublicPrefix = publicPrefixes.some((prefix) => path.startsWith(prefix));

    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;

    const sessionValid = hasValidSession(accessToken, refreshToken);

    if (publicRoute) {
        if (sessionValid && publicRoute.whenAuthenticated === "redirect") {
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = REDIRECT_WHEN_AUTHENTICATED_ROUTE;
            return NextResponse.redirect(redirectUrl);
        }
        return NextResponse.next();
    }

    if (isPublicPrefix) {
        return NextResponse.next();
    }

    if (!sessionValid) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE;
        redirectUrl.searchParams.set("next", `${path}${search}`);

        const response = NextResponse.redirect(redirectUrl);
        response.cookies.delete("accessToken");
        response.cookies.delete("refreshToken");
        return response;
    }

    return NextResponse.next();
}

export const config: MiddlewareConfig = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};


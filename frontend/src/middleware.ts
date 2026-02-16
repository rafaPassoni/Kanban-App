import { NextResponse, type MiddlewareConfig, type NextRequest } from "next/server";
import { isJwtExpired } from "@/lib/jwt";

// Rotas publicas que nao exigem sessao ativa.
const publicRoutes = [
    { path: "/login", whenAuthenticated: "redirect" },
] as const;

// Prefixos publicos uteis para visualizacao sem login (ex.: modo TV).
const publicPrefixes = ["/kanban/tv"] as const;

const REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE = "/login";
const REDIRECT_WHEN_AUTHENTICATED_ROUTE = "/";

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


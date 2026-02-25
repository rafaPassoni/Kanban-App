import { NextResponse, type MiddlewareConfig, type NextRequest } from "next/server";

// Rotas publicas que nao exigem sessao ativa.
const publicRoutes = [
    { path: "/login", whenAuthenticated: "redirect" },
] as const;

// Prefixos publicos uteis para visualizacao sem login (ex.: modo TV).
const publicPrefixes = ["/kanban/tv"] as const;

const REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE = "/login";
const REDIRECT_WHEN_AUTHENTICATED_ROUTE = "/";

/**
 * Verifica sessao via cookies httpOnly.
 * O middleware do Next.js roda no servidor e pode ler cookies httpOnly.
 * Basta checar a presenca: se access_token ou refresh_token existem, sessao potencialmente valida.
 */
function hasValidSession(request: NextRequest): boolean {
    if (request.cookies.has("access_token")) return true;
    if (request.cookies.has("refresh_token")) return true;
    return false;
}

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const search = request.nextUrl.search;
    const publicRoute = publicRoutes.find((route) => route.path === path);
    const isPublicPrefix = publicPrefixes.some((prefix) => path.startsWith(prefix));

    const sessionValid = hasValidSession(request);

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
        response.cookies.delete("access_token");
        response.cookies.delete("refresh_token");
        response.cookies.delete("is_authenticated");
        return response;
    }

    return NextResponse.next();
}

export const config: MiddlewareConfig = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};

import axios from "axios";
import Cookies from "js-cookie";
import { API_TOKEN, API_TOKEN_REFRESH, API_LOGOUT } from "@/constants/api";
import { getJwtExpiryMs } from "@/lib/jwt";

let interceptorsInitialized = false;
let forceLogoutTriggered = false;

/**
 * Identifica endpoints de autenticação para evitar:
 * - inserir Authorization em token/refresh/logout
 * - tentar refresh em endpoints de auth
 */
function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;

  return (
    url.includes("/api/token/") ||
    url.includes("/api/token/refresh/") ||
    url.includes("/api/logout/")
  );
}

export const AuthService = {
  /**
   * Inicializa interceptors do Axios 1 única vez.
   * - Request: injeta Bearer token se existir
   * - Response: ao receber 401, tenta refresh e repete request original
   */
  setupAxiosInterceptors: () => {
    if (interceptorsInitialized) return;
    interceptorsInitialized = true;

    axios.interceptors.request.use(
      (config) => {
        // Não mexer em chamadas de autenticação
        if (isAuthEndpoint(config.url)) return config;

        const token = AuthService.getAccessToken();
        if (!token) return config;

        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;

        return config;
      },
      (error) => Promise.reject(error),
    );

    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error?.config;

        // Se não tiver response (ex.: erro de rede), apenas repassa
        if (!error?.response) {
          return Promise.reject(error);
        }

        const status = error.response.status;

        const shouldTryRefresh =
          status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !isAuthEndpoint(originalRequest.url);

        if (!shouldTryRefresh) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        const refreshToken = AuthService.getRefreshToken();

        // Se não tem refresh ou já expirou, desloga direto
        if (!refreshToken) {
          AuthService.forceLogout("/login");
          return Promise.reject(error);
        }

        try {
          const refreshResponse = await axios.post(API_TOKEN_REFRESH, {
            refresh: refreshToken,
          });

          const { access } = refreshResponse.data as { access: string };

          // Atualiza cookie com novo access
          AuthService.setAccessToken(access);

          // Repete a requisição original com o novo access
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${access}`;

          return axios(originalRequest);
        } catch (refreshError) {
          // Refresh falhou → desloga e manda pro login
          AuthService.forceLogout("/login");
          return Promise.reject(refreshError);
        }
      },
    );
  },

  /**
   * Faz login e grava access/refresh.
   */
  login: async (username: string, password: string) => {
    const response = await axios.post(API_TOKEN, {
      username,
      password,
    });

    const { access, refresh } = response.data as { access: string; refresh: string };

    AuthService.setAccessToken(access);
    AuthService.setRefreshToken(refresh);

    return response.data;
  },

  /**
   * Faz logout no backend (se possível) e limpa client-side.
   */
  logout: async () => {
    try {
      const refreshToken = AuthService.getRefreshToken();
      if (refreshToken) {
        await axios.post(API_LOGOUT, { refresh: refreshToken });
      }
    } catch {
      // Ignora erros e segue com logout local
    } finally {
      AuthService.forceLogout("/login");
    }
  },

  /**
   * Verifica se existe sessão válida:
   * - access válido OU refresh válido
   */
  hasValidSession: () => {
    const access = AuthService.getAccessToken();
    if (access && !AuthService.isTokenExpired(access)) return true;

    const refresh = AuthService.getRefreshToken();
    if (refresh && !AuthService.isTokenExpired(refresh)) return true;

    return false;
  },

  /**
   * Força logout:
   * - remove cookies
   * - limpa sessionStorage
   * - redireciona para /login (você não tem home)
   *
   * O guard "forceLogoutTriggered" evita loops / múltiplos redirects.
   */
  forceLogout: (redirectTo: string = "/login") => {
    if (typeof window === "undefined") return;
    if (forceLogoutTriggered) return;
    forceLogoutTriggered = true;

    Cookies.remove("accessToken", { path: "/" });
    Cookies.remove("refreshToken", { path: "/" });

    window.location.assign(redirectTo);
  },

  /**
   * Indica se o usuário está autenticado (access presente E NÃO expirado).
   * Antes era só "existe token", o que causava estados inconsistentes.
   */
  isAuthenticated: () => {
    const access = AuthService.getAccessToken();
    return !!access && !AuthService.isTokenExpired(access);
  },


  refreshAccessToken: async (): Promise<string | undefined> => {
    const refreshToken = AuthService.getRefreshToken();
    if (!refreshToken) {
      return undefined;
    }

    try {
      const refreshResponse = await axios.post(API_TOKEN_REFRESH, {
        refresh: refreshToken,
      });

      const { access } = refreshResponse.data as { access: string };
      AuthService.setAccessToken(access);
      return access;
    } catch {
      return undefined;
    }
  },

  fetchWithAuth: async (input: RequestInfo, init: RequestInit = {}) => {
    const getNextRedirect = () => {
      if (typeof window === "undefined") return "/login";
      const next = `${window.location.pathname}${window.location.search}`;
      return `/login?next=${encodeURIComponent(next)}`;
    };

    let token = AuthService.getAccessToken();
    if (!token || AuthService.isTokenExpired(token)) {
      token = await AuthService.refreshAccessToken();
      if (!token) {
        AuthService.forceLogout(getNextRedirect());
        throw new Error("Sessão expirada");
      }
    }

    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(input, { ...init, headers });

    if (response.status !== 401) return response;

    const refreshed = await AuthService.refreshAccessToken();
    if (!refreshed) {
      AuthService.forceLogout(getNextRedirect());
      return response;
    }

    const retryHeaders = new Headers(init.headers);
    retryHeaders.set("Authorization", `Bearer ${refreshed}`);

    const retryResponse = await fetch(input, { ...init, headers: retryHeaders });
    if (retryResponse.status === 401) {
      AuthService.forceLogout(getNextRedirect());
    }
    return retryResponse;
  },

  getAccessToken: () => Cookies.get("accessToken"),

  getRefreshToken: () => Cookies.get("refreshToken"),

  /**
   * Salva o accessToken no cookie com a expiração do próprio JWT.
   * Se não conseguir ler exp, coloca um fallback curto (1h).
   */
  setAccessToken: (token: string) => {
    const expiryMs = getJwtExpiryMs(token);

    // Fallback: 1 hora
    const expires = expiryMs ? new Date(expiryMs) : 1 / 24;

    Cookies.set("accessToken", token, {
      expires,
      secure: window.location.protocol === "https:",
      sameSite: "lax",
      path: "/",
    });
  },

  /**
   * Salva o refreshToken no cookie com a expiração do próprio JWT.
   * Se não conseguir ler exp, usa fallback de 7 dias.
   */
  setRefreshToken: (token: string) => {
    const expiryMs = getJwtExpiryMs(token);
    const expires = expiryMs ? new Date(expiryMs) : 7;

    Cookies.set("refreshToken", token, {
      expires,
      secure: window.location.protocol === "https:",
      sameSite: "lax",
      path: "/",
    });
  },

  /**
   * Checa expiração do token.
   * Inclui tolerância de relógio (skew) para reduzir falsos expirados
   * (ex.: relógio do Windows adiantado/atrasado).
   */
  isTokenExpired: (token: string) => {
    if (!token) return true;

    const expiryMs = getJwtExpiryMs(token);
    if (!expiryMs) return true;

    // Tolerância: considera "expirado" um pouco antes (30s)
    // Ajuda a evitar edge cases e problemas de clock.
    const CLOCK_SKEW_MS = 30_000;

    return expiryMs < Date.now() + CLOCK_SKEW_MS;
  },
};

export default AuthService;

import axios from "axios";
import { API_TOKEN, API_TOKEN_REFRESH, API_LOGOUT } from "@/constants/api";

let interceptorsInitialized = false;
let forceLogoutTriggered = false;

// Cookies httpOnly sao enviados automaticamente pelo browser.
axios.defaults.withCredentials = true;

/**
 * Identifica endpoints de autenticacao para evitar
 * tentar refresh em endpoints de auth.
 */
function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;

  return (
    url.includes("/api/token/") ||
    url.includes("/api/token/refresh/") ||
    url.includes("/api/logout/")
  );
}

/**
 * Verifica se o cookie nao-httpOnly "is_authenticated" existe.
 * Esse cookie e setado pelo backend junto com os tokens httpOnly.
 */
function hasAuthFlag(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim().startsWith("is_authenticated="));
}

/**
 * Remove o cookie flag "is_authenticated" (unico acessivel pelo JS).
 */
function clearAuthFlag() {
  if (typeof document === "undefined") return;
  document.cookie = "is_authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

export const AuthService = {
  /**
   * Inicializa interceptors do Axios 1 unica vez.
   * Response: ao receber 401, tenta refresh (browser envia cookie automaticamente).
   */
  setupAxiosInterceptors: () => {
    if (interceptorsInitialized) return;
    interceptorsInitialized = true;

    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error?.config;

        // Se nao tiver response (ex.: erro de rede), apenas repassa
        if (!error?.response) {
          return Promise.reject(error);
        }

        const shouldTryRefresh =
          error.response.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !isAuthEndpoint(originalRequest.url);

        if (!shouldTryRefresh) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
          // Browser envia refresh_token cookie automaticamente
          await axios.post(API_TOKEN_REFRESH);

          // Backend setou novo access_token cookie; repete request original
          return axios(originalRequest);
        } catch {
          // Refresh falhou — desloga
          AuthService.forceLogout("/login");
          return Promise.reject(error);
        }
      },
    );
  },

  /**
   * Faz login — backend seta cookies httpOnly automaticamente.
   */
  login: async (username: string, password: string) => {
    await axios.post(API_TOKEN, { username, password });
  },

  /**
   * Faz logout no backend (limpa cookies httpOnly) e redireciona.
   */
  logout: async () => {
    try {
      await axios.post(API_LOGOUT);
    } catch {
      // Ignora erros e segue com logout local
    } finally {
      AuthService.forceLogout("/login");
    }
  },

  /**
   * Verifica se existe sessao ativa via cookie flag.
   */
  hasValidSession: () => hasAuthFlag(),

  /**
   * Forca logout:
   * - limpa cookie flag (unico acessivel pelo JS)
   * - redireciona para /login
   *
   * O guard "forceLogoutTriggered" evita loops / multiplos redirects.
   */
  forceLogout: (redirectTo: string = "/login") => {
    if (typeof window === "undefined") return;
    if (forceLogoutTriggered) return;
    forceLogoutTriggered = true;

    clearAuthFlag();
    window.location.assign(redirectTo);
  },

  /**
   * Indica se o usuario esta autenticado (cookie flag presente).
   */
  isAuthenticated: () => hasAuthFlag(),

  /**
   * Tenta renovar o access token via refresh cookie.
   * Retorna true se sucesso, false se falha.
   */
  refreshAccessToken: async (): Promise<boolean> => {
    try {
      await axios.post(API_TOKEN_REFRESH);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Wrapper de fetch que envia cookies httpOnly automaticamente.
   * Em caso de 401, tenta refresh e repete a request.
   */
  fetchWithAuth: async (input: RequestInfo, init: RequestInit = {}): Promise<Response> => {
    const doFetch = () => fetch(input, { ...init, credentials: "include" });

    const response = await doFetch();
    if (response.status !== 401) return response;

    // Tenta refresh e repete
    const refreshed = await AuthService.refreshAccessToken();
    if (!refreshed) {
      AuthService.forceLogout("/login");
      return response;
    }

    const retryResponse = await doFetch();
    if (retryResponse.status === 401) {
      AuthService.forceLogout("/login");
    }
    return retryResponse;
  },
};

export default AuthService;

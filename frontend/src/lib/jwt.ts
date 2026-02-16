type JwtPayload = {
  exp?: number;
};

/**
 * Decodifica o payload do JWT (parte do meio do token).
 * Nao valida assinatura — serve apenas para ler claims como "exp".
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const payloadBase64Url = parts[1];
    if (!payloadBase64Url) return null;

    const base64 = payloadBase64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

    const payloadJson = atob(padded);
    return JSON.parse(payloadJson) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Retorna o exp do JWT em milissegundos (Date.now() compativel).
 */
export function getJwtExpiryMs(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return null;
  return payload.exp * 1000;
}

/**
 * Verifica se um JWT esta expirado.
 */
export function isJwtExpired(token: string | undefined): boolean {
  if (!token) return true;

  const expiryMs = getJwtExpiryMs(token);
  if (!expiryMs) return true;

  return expiryMs < Date.now();
}

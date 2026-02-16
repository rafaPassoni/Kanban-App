/**
 * Extrai array de resultados de uma resposta DRF (paginada ou não).
 * Suporta ambos os formatos: array direto ou `{ results: [...] }`.
 */
export function extractResults<T>(data: unknown): T[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object" && "results" in data) {
        const paginated = data as { results: unknown };
        if (Array.isArray(paginated.results)) return paginated.results as T[];
    }
    return [];
}

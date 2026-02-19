/**
 * Constantes centralizadas de URLs da API
 * Todas as URLs base utilizadas pelo frontend
 */

export const API_BASE = process.env.NEXT_PUBLIC_URL ?? "";
if (!API_BASE && typeof window !== "undefined") {
    console.warn("[api] NEXT_PUBLIC_URL nao definida — chamadas API podem falhar.");
}

// Autenticação
export const API_TOKEN = `${API_BASE}/api/token/`;
export const API_TOKEN_REFRESH = `${API_BASE}/api/token/refresh/`;
export const API_LOGOUT = `${API_BASE}/api/logout/`;

// Kanban
export const API_TASKS = `${API_BASE}/api/v1/tasks`;
export const API_TASKS_PUBLIC = `${API_BASE}/api/v1/tasks-public/`;
export const API_SUBTASKS = `${API_BASE}/api/v1/subtasks`;

// Dependências do Kanban
export const API_PROJECTS = `${API_BASE}/api/v1/projects`;
export const API_COLLABORATORS = `${API_BASE}/api/v1/collaborators`;
export const API_DEPARTMENTS = `${API_BASE}/api/v1/departments`;

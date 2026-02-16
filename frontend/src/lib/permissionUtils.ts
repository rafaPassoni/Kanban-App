/**
 * Mapeamento de grupos e suas rotas permitidas
 * Sincronizado com o backend (authentication/permissions.py)
 */

import type { ComponentType } from "react";

export interface RoutePermission {
    label: string;
    href: string;
    icon: ComponentType<unknown>;
}

export interface UserPermissions {
    user?: {
        groups?: string[];
        is_superuser?: boolean;
        is_staff?: boolean;
    };
    permissions?: Record<string, string[]>;
}

const PERMISSION_ROUTE_MAP: Record<string, string | string[]> = {
    "projectsmanager.project": "/kanban",
    "tasks.task": ["/kanban", "/projetos"],
    "tasks.subtask": "/kanban",
    "collaborators.collaborator": "/projetos",
};

// Mapeamento de grupos para rotas
const GROUP_ROUTES: Record<string, string[]> = {
    "Administrador Completo": ["/", "/kanban", "/projetos"],
    "Gerenciador de Projetos": ["/", "/kanban", "/projetos"],
    "Gerenciador de Kanban": ["/", "/kanban", "/projetos"],
    "Visualizador Completo": ["/", "/kanban", "/projetos"],
    "Visualizador de Projetos": ["/", "/kanban", "/projetos"],
    "Visualizador de Kanban": ["/", "/kanban"],
    GRUPO: [],
};


/**
 * Obtem as rotas permitidas para um usuario baseado em seus grupos
 * @param userPermissions - Dados de permissoes do usuario
 * @returns Array de rotas permitidas
 */
export function getAllowedRoutes(userPermissions: UserPermissions): string[] {
    // Se nao houver dados, retorna array vazio
    if (!userPermissions.user) {
        return [];
    }

    // Superusers e Staff tem acesso a todas as rotas
    if (userPermissions.user.is_superuser || userPermissions.user.is_staff) {
        return ["/", "/kanban", "/projetos"];
    }

    const allowedRoutes = new Set<string>();

    const permissions = userPermissions.permissions ?? {};
    for (const [permissionKey, actions] of Object.entries(permissions)) {
        const routes = PERMISSION_ROUTE_MAP[permissionKey];
        if (!routes || !actions || actions.length === 0) continue;
        if (Array.isArray(routes)) {
            routes.forEach((route) => allowedRoutes.add(route));
        } else {
            allowedRoutes.add(routes);
        }
    }

    // Coleta todas as rotas dos grupos do usuario
    if (userPermissions.user.groups) {
        for (const group of userPermissions.user.groups) {
            const groupRoutes = GROUP_ROUTES[group];
            if (groupRoutes) {
                groupRoutes.forEach((route) => allowedRoutes.add(route));
            }
        }
    }

    return Array.from(allowedRoutes);
}

/**
 * Obtem a primeira rota permitida para um usuario
 * Util para redirecionamento apos login
 * @param userPermissions - Dados de permissoes do usuario
 * @returns A primeira rota permitida, ou null se nao houver nenhuma
 */
export function getFirstAllowedRoute(userPermissions: UserPermissions): string | null {
    // Ordem de prioridade das rotas
    const routeOrder = ["/", "/kanban", "/projetos"];

    const allowedRoutes = getAllowedRoutes(userPermissions);

    // Retorna a primeira rota na ordem de prioridade que esta permitida
    for (const route of routeOrder) {
        if (allowedRoutes.includes(route)) {
            return route;
        }
    }

    return null;
}

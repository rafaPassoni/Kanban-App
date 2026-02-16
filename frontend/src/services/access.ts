import AuthService from "./auth";
import { API_USER_PERMISSIONS } from "@/constants/api";

export const AccessService = {
    async getUserPermissions(): Promise<string[]> {
        const token = AuthService.getAccessToken();
        if (!token) return [];
        try {
            const res = await fetch(API_USER_PERMISSIONS, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data?.permissions) ? data.permissions : [];
        } catch {
            return [];
        }
    },

    has(perms: string[], action: "add" | "change" | "delete" | "view", model: string): boolean {
        return perms.includes(`${action}_${model}`);
    },
};

export default AccessService;

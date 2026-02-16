"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AuthService from "@/services/auth";
import { API_PERMISSIONS, API_USER_PERMISSIONS, API_USER_FULL_ACCESS } from "@/constants/api";

export default function Providers({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isPublicPath = pathname === "/login" || pathname.startsWith("/kanban/tv");
    const [authReady, setAuthReady] = useState(isPublicPath);

    const ensurePermissionCache = useCallback(async () => {
        if (typeof window === "undefined") return;
        if (isPublicPath) return;

        const hasCache =
            sessionStorage.getItem("allPerms") &&
            sessionStorage.getItem("userPerms") &&
            sessionStorage.getItem("isStaff");

        if (hasCache) return;

        try {
            const [allPermsRes, userPermsRes, isStaffRes] = await Promise.all([
                AuthService.fetchWithAuth(API_PERMISSIONS),
                AuthService.fetchWithAuth(API_USER_PERMISSIONS),
                AuthService.fetchWithAuth(API_USER_FULL_ACCESS),
            ]);

            let updated = false;
            if (allPermsRes.ok) {
                sessionStorage.setItem("allPerms", JSON.stringify(await allPermsRes.json()));
                updated = true;
            }
            if (userPermsRes.ok) {
                sessionStorage.setItem("userPerms", JSON.stringify(await userPermsRes.json()));
                updated = true;
            }
            if (isStaffRes.ok) {
                sessionStorage.setItem("isStaff", JSON.stringify(await isStaffRes.json()));
                updated = true;
            }

            if (updated) {
                window.dispatchEvent(new Event("permissions-updated"));
            }
        } catch {
            // Avoid blocking navigation on transient failures.
        }
    }, [isPublicPath]);

    useEffect(() => {
        AuthService.setupAxiosInterceptors();
    }, []);

    useEffect(() => {
        if (isPublicPath) {
            setAuthReady(true);
            return;
        }

        if (!AuthService.hasValidSession()) {
            const next = `${window.location.pathname}${window.location.search}`;
            AuthService.forceLogout(`/login?next=${encodeURIComponent(next)}`);
            return;
        }

        setAuthReady(true);
    }, [isPublicPath, pathname]);

    useEffect(() => {
        if (!authReady || isPublicPath) return;
        ensurePermissionCache();
    }, [authReady, ensurePermissionCache, isPublicPath]);

    useEffect(() => {
        if (isPublicPath) return;

        const intervalId = window.setInterval(() => {
            if (!AuthService.hasValidSession()) {
                const next = `${window.location.pathname}${window.location.search}`;
                AuthService.forceLogout(`/login?next=${encodeURIComponent(next)}`);
            }
        }, 10 * 60_000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [isPublicPath, pathname]);

    if (!authReady && !isPublicPath) {
        return null;
    }

    return children;
}

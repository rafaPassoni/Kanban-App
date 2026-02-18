"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AuthService from "@/services/auth";

export default function Providers({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isPublicPath = pathname === "/login" || pathname.startsWith("/kanban/tv");
    const [authReady, setAuthReady] = useState(isPublicPath);

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

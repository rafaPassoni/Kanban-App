"use client";

import axios from "axios";
import Cookies from "js-cookie";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircleUser, User, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import AuthService from "@/services/auth";
import { API_TOKEN } from "@/constants/api";
import ErrorBoundary from "@/app/components/ErrorBoundary";

// ====================
// Componentes
// ====================
function LoginScreenContent() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [errors, setErrors] = useState({ username: "", password: "" });

    // evita setState apos unmount (ex: redirect rapido)
    const isMountedRef = useRef(true);
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const optionsToast = useMemo(
        () => ({
            position: "top-right" as const,
            autoClose: 2000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
        }),
        [],
    );

    useEffect(() => {
        Cookies.remove("accessToken", { path: "/" });
        Cookies.remove("refreshToken", { path: "/" });
    }, []);

    const setSafeLoading = useCallback((v: boolean) => {
        if (!isMountedRef.current) return;
        setLoading(v);
    }, []);

    const setSafeErrors = useCallback((next: { username: string; password: string }) => {
        if (!isMountedRef.current) return;
        setErrors(next);
    }, []);

    const validateForm = useCallback(() => {
        const next = { username: "", password: "" };
        let ok = true;

        if (!username.trim()) {
            next.username = "Usuário é obrigatório";
            ok = false;
        }
        if (!password) {
            next.password = "Senha é obrigatória";
            ok = false;
        }

        setSafeErrors(next);
        return ok;
    }, [username, password, setSafeErrors]);

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (loading) return;

            if (!validateForm()) return;

            setSafeLoading(true);

            try {
                const response = await axios.post(API_TOKEN, {
                    username: username.trim(),
                    password,
                });

                const { access, refresh } = response.data as { access: string; refresh: string };

                AuthService.setAccessToken(access);
                AuthService.setRefreshToken(refresh);

                toast.success("Login realizado com sucesso!", optionsToast);

                router.replace("/kanban");
            } catch (err) {
                console.error("Erro ao fazer login:", err);
                toast.error("Usuário ou senha incorretos!", optionsToast);
            } finally {
                setSafeLoading(false);
            }
        },
        [
            loading,
            validateForm,
            username,
            password,
            optionsToast,
            router,
            setSafeLoading,
        ],
    );

    const onChangeUsername = useCallback((v: string) => {
        setUsername(v);
        setErrors((prev) => (prev.username ? { ...prev, username: "" } : prev));
    }, []);

    const onChangePassword = useCallback((v: string) => {
        setPassword(v);
        setErrors((prev) => (prev.password ? { ...prev, password: "" } : prev));
    }, []);

    return (
        <div className="relative min-h-screen overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_60rem_at_20%_10%,rgba(59,130,246,0.22),transparent_55%),radial-gradient(60rem_60rem_at_90%_90%,rgba(14,165,233,0.16),transparent_50%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-30 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-size-[64px_64px]" />

            <ToastContainer />

            <div className="relative mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-center justify-center px-4 py-10">
                <div className="-translate-y-6 sm:-translate-y-8 w-full max-w-md">
                    <div className="mb-6 flex justify-center">
                        <div className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-slate-900/50 p-4 shadow-xl shadow-slate-950/40 backdrop-blur">
                            <Image
                                width={420}
                                height={420}
                                src="https://raw.githubusercontent.com/Chiaperini-TI/Chiaperini-TI/main/chiaperini-dev-mobile.webp"
                                alt="Chiaperini TI"
                                className="h-20 w-auto rounded-md sm:h-28"
                                unoptimized
                                priority
                            />
                        </div>
                    </div>

                    <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/55 shadow-2xl shadow-slate-950/60 backdrop-blur">
                        <div className="border-b border-white/10 p-6 sm:p-8">
                            <div className="flex items-center gap-3">
                                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-500/10 text-blue-200 ring-1 ring-blue-500/20">
                                    <CircleUser className="h-6 w-6" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="truncate text-xl font-semibold text-slate-50">Bem-vindo</h2>
                                    <p className="text-sm text-slate-300">Entre para continuar.</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                            <div className="space-y-5">
                                <div>
                                    <label htmlFor="username" className="mb-2 block text-sm font-medium text-slate-200">
                                        Usuário:
                                    </label>

                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <User className="h-4.5 w-4.5 text-slate-400" />
                                        </div>

                                        <input
                                            type="text"
                                            id="username"
                                            autoComplete="username"
                                            inputMode="text"
                                            disabled={loading}
                                            aria-invalid={!!errors.username}
                                            aria-describedby={errors.username ? "username-error" : undefined}
                                            className={`block w-full rounded-xl border bg-slate-950/40 p-3 pl-10 text-slate-50 placeholder:text-slate-500 outline-none transition focus:ring-2 focus:ring-blue-500/50 ${errors.username
                                                    ? "border-red-500/50 focus:border-red-500/60"
                                                    : "border-white/10 focus:border-blue-500/40"
                                                } disabled:cursor-not-allowed disabled:opacity-60`}
                                            placeholder="Digite seu usuário"
                                            value={username}
                                            onChange={(e) => onChangeUsername(e.target.value)}
                                        />
                                    </div>

                                    {errors.username && (
                                        <p id="username-error" className="mt-1 text-sm text-red-300">
                                            {errors.username}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
                                        Senha:
                                    </label>

                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <Lock className="h-4.5 w-4.5 text-slate-400" />
                                        </div>

                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="password"
                                            autoComplete="current-password"
                                            disabled={loading}
                                            aria-invalid={!!errors.password}
                                            aria-describedby={errors.password ? "password-error" : undefined}
                                            className={`block w-full rounded-xl border bg-slate-950/40 p-3 pl-10 pr-11 text-slate-50 placeholder:text-slate-500 outline-none transition focus:ring-2 focus:ring-blue-500/50 ${errors.password
                                                    ? "border-red-500/50 focus:border-red-500/60"
                                                    : "border-white/10 focus:border-blue-500/40"
                                                } disabled:cursor-not-allowed disabled:opacity-60`}
                                            placeholder="Digite sua senha"
                                            value={password}
                                            onChange={(e) => onChangePassword(e.target.value)}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-slate-400 transition hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                                            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                                            disabled={loading}
                                        >
                                            {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                                        </button>
                                    </div>

                                    {errors.password && (
                                        <p id="password-error" className="mt-1 text-sm text-red-300">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                                >
                                    {loading ? (
                                        <>
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                                            Validando...
                                        </>
                                    ) : (
                                        <>
                                            Entrar
                                            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                                        </>
                                    )}
                                </button>
                            </div>

                            <p className="mt-6 text-center text-xs text-slate-400">
                                Problemas de acesso? Fale com o administrador.
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ====================
// Página
// ====================
export default function LoginScreen() {
    return (
        <ErrorBoundary>
            <Suspense fallback={null}>
                <LoginScreenContent />
            </Suspense>
        </ErrorBoundary>
    );
}

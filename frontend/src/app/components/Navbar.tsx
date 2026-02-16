"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as Icon from "react-bootstrap-icons";

import logo from "../../../public/logo.png";
import AuthService from "@/services/auth";
import { Button } from "@/components/ui/button";
import { getAllowedRoutes } from "@/lib/permissionUtils";
import type { UserPermissions } from "@/lib/permissionUtils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<Icon.IconProps>;
};

function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default function NavHoverIcons() {
  const pathname = usePathname();

  const [allowedHrefs, setAllowedHrefs] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const directLinks = useMemo(
    () =>
      [
        { label: "Kanban", href: "/kanban", icon: Icon.KanbanFill },
        { label: "Projetos", href: "/projetos", icon: Icon.FolderFill },
      ] as NavItem[],
    [],
  );

  const loadAllowedRoutes = useCallback(() => {
    if (typeof window === "undefined") return;

    const userPermissions = safeParseJSON<UserPermissions>(
      sessionStorage.getItem("isStaff"),
    );

    if (!userPermissions) {
      setAllowedHrefs([]);
      return;
    }

    const allowed = getAllowedRoutes(userPermissions);
    setAllowedHrefs(Array.isArray(allowed) ? allowed : []);
  }, []);

  useEffect(() => {
    loadAllowedRoutes();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "isStaff") loadAllowedRoutes();
    };
    const onPermissionsUpdated = () => loadAllowedRoutes();

    window.addEventListener("storage", onStorage);
    window.addEventListener("permissions-updated", onPermissionsUpdated);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("permissions-updated", onPermissionsUpdated);
    };
  }, [loadAllowedRoutes]);

  const isActive = useCallback(
    (href: string) => {
      if (!pathname) return false;
      if (pathname === href) return true;
      return pathname.startsWith(`${href}/`);
    },
    [pathname],
  );

  const visibleDirectLinks = useMemo(() => {
    return directLinks.filter((item) =>
      allowedHrefs.includes(item.href),
    );
  }, [directLinks, allowedHrefs]);

  // Fecha menu mobile ao navegar
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Bloqueia scroll do body quando menu mobile está aberto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="relative z-40 flex w-full justify-center px-2 pt-4 pb-4">
        <nav className="flex w-full max-w-8xl items-center justify-between rounded-2xl border border-slate-800/70 bg-slate-900/90 px-3 py-3 shadow-lg shadow-slate-950/50 backdrop-blur-xl sm:px-6 sm:py-4">
          {/* Logotipo e titulo */}
          <Link href="/kanban" className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-800/90 ring-1 ring-slate-700/90 sm:h-11 sm:w-11">
              <Image
                width={40}
                height={40}
                className="h-full w-full object-contain"
                src={logo}
                alt="Logo"
                unoptimized
                priority
              />
            </div>

            <div className="hidden flex-col leading-tight sm:flex">
              <span className="text-sm font-semibold text-slate-50">
                Kanban Qualidade
              </span>
              <span className="hidden text-xs text-slate-400 min-[1300px]:inline">
                Gestão de Qualidade
              </span>
            </div>
          </Link>

          {/* Navegacao principal - Desktop */}
          <div className="flex items-center gap-1 sm:gap-4">
            <div className="hidden items-center gap-2 lg:flex">
              {/* Links diretos */}
              {visibleDirectLinks.map(
                ({ label, href, icon: IconComponent }) => {
                const active = isActive(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    className="group relative rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-blue-300"
                    aria-current={active ? "page" : undefined}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={[
                          "flex h-6 w-6 items-center justify-center rounded-lg text-base transition-colors group-hover:bg-blue-500/10 group-hover:text-blue-300",
                          active
                            ? "bg-blue-500/10 text-blue-300"
                            : "bg-slate-800 text-slate-300",
                        ].join(" ")}
                      >
                        <IconComponent />
                      </span>

                      <span className={[
                        "transition-colors group-hover:text-blue-300",
                        active ? "text-blue-300" : "text-slate-300",
                      ].join(" ")}>
                        {label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Botao hamburger - Mobile/Tablet */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 transition-colors hover:bg-slate-800 hover:text-blue-300 lg:hidden cursor-pointer"
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <Icon.XLg className="text-lg" />
              ) : (
                <Icon.List className="text-xl" />
              )}
            </button>

            {/* Botao sair */}
            <Button
              type="button"
              variant="destructive"
              onClick={AuthService.logout}
              className="gap-2 rounded-full bg-rose-600 px-3 py-2 text-xs font-medium shadow-md shadow-rose-900/40 hover:bg-rose-500 cursor-pointer sm:px-4"
            >
              <Icon.BoxArrowRight className="text-sm" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </nav>
      </header>

      {/* Overlay do menu mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Drawer mobile */}
      <aside
        className={[
          "fixed top-0 right-0 z-50 flex h-full w-70 max-w-[85vw] flex-col bg-slate-900 border-l border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden",
          mobileMenuOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        {/* Header do drawer */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-800/90 ring-1 ring-slate-700/90">
              <Image
                width={36}
                height={36}
                className="h-full w-full object-contain"
                src={logo}
                alt="Logo"
                unoptimized
              />
            </div>
            <span className="text-sm font-semibold text-slate-50">Menu</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 cursor-pointer"
            aria-label="Fechar menu"
          >
            <Icon.XLg className="text-lg" />
          </button>
        </div>

        {/* Conteudo do drawer - scrollavel */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {/* Links diretos mobile */}
          {visibleDirectLinks.map(
            ({ label, href, icon: IconComponent }) => {
              const active = isActive(href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "mb-0.5 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-500/10 text-blue-300"
                      : "text-slate-300 hover:bg-slate-800/50 hover:text-blue-300",
                  ].join(" ")}
                  aria-current={active ? "page" : undefined}
                >
                  <span
                    className={[
                      "flex h-8 w-8 items-center justify-center rounded-lg text-base transition-colors",
                      active
                        ? "bg-blue-500/10 text-blue-300"
                        : "bg-slate-800 text-slate-300",
                    ].join(" ")}
                  >
                    <IconComponent />
                  </span>
                  <span>{label}</span>
                </Link>
              );
            },
          )}
        </div>

        {/* Footer do drawer */}
        <div className="border-t border-slate-800 px-4 py-4">
          <Button
            type="button"
            variant="destructive"
            onClick={AuthService.logout}
            className="w-full gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-medium shadow-md shadow-rose-900/40 hover:bg-rose-500 cursor-pointer"
          >
            <Icon.BoxArrowRight className="text-base" /> Sair
          </Button>
        </div>
      </aside>
    </>
  );
}

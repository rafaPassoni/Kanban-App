"use client";
import React, { useCallback, useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "@/app/components/Navbar";
import AuthService from "@/services/auth";
import AccessService from "@/services/access";
import { FolderOpen, Users, Building2 } from "lucide-react";
import ResponsaveisTab from "./components/ResponsaveisTab";
import ProjetosTab from "./components/ProjetosTab";
import SetoresTab from "./components/SetoresTab";

export default function ProjetosPage() {
    const [activeTab, setActiveTab] = useState<"responsaveis" | "projetos" | "setores">("projetos");

    const authedFetch = useCallback(
        async (url: string, options?: RequestInit) => AuthService.fetchWithAuth(url, options),
        [],
    );

    // Permissões
    const [perms, setPerms] = useState({
        canAddResp: false, canEditResp: false, canDeleteResp: false,
        canAddProj: false, canEditProj: false, canDeleteProj: false,
        canAddDept: false, canEditDept: false, canDeleteDept: false,
    });

    useEffect(() => {
        AccessService.getUserPermissions().then((p) => {
            setPerms({
                canAddResp: AccessService.has(p, "add", "collaborator"),
                canEditResp: AccessService.has(p, "change", "collaborator"),
                canDeleteResp: AccessService.has(p, "delete", "collaborator"),
                canAddProj: AccessService.has(p, "add", "task"),
                canEditProj: AccessService.has(p, "change", "task"),
                canDeleteProj: AccessService.has(p, "delete", "task"),
                canAddDept: AccessService.has(p, "add", "department"),
                canEditDept: AccessService.has(p, "change", "department"),
                canDeleteDept: AccessService.has(p, "delete", "department"),
            });
        });
    }, []);

    const tabClass = (tab: string) => [
        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer",
        activeTab === tab
            ? "bg-blue-600/20 text-blue-300 border border-blue-500/40"
            : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-slate-200 hover:border-slate-600",
    ].join(" ");

    return (
        <div className="min-h-screen">
            <Navbar />
            <ToastContainer position="top-right" theme="dark" autoClose={3000} />

            <main className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-6">
                <div className="flex items-center gap-3 mb-6">
                    <FolderOpen className="h-8 w-8 text-blue-400" />
                    <h1 className="text-2xl font-semibold text-slate-50">Projetos</h1>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-6">
                    <button type="button" onClick={() => setActiveTab("projetos")} className={tabClass("projetos")}>
                        <FolderOpen className="h-4 w-4" /> Projetos
                    </button>
                    <button type="button" onClick={() => setActiveTab("responsaveis")} className={tabClass("responsaveis")}>
                        <Users className="h-4 w-4" /> Responsáveis
                    </button>
                    <button type="button" onClick={() => setActiveTab("setores")} className={tabClass("setores")}>
                        <Building2 className="h-4 w-4" /> Setores
                    </button>
                </div>

                {activeTab === "responsaveis" && (
                    <ResponsaveisTab
                        authedFetch={authedFetch}
                        canAdd={perms.canAddResp}
                        canEdit={perms.canEditResp}
                        canDelete={perms.canDeleteResp}
                    />
                )}
                {activeTab === "projetos" && (
                    <ProjetosTab
                        authedFetch={authedFetch}
                        canAdd={perms.canAddProj}
                        canEdit={perms.canEditProj}
                        canDelete={perms.canDeleteProj}
                    />
                )}
                {activeTab === "setores" && (
                    <SetoresTab
                        authedFetch={authedFetch}
                        canAdd={perms.canAddDept}
                        canEdit={perms.canEditDept}
                        canDelete={perms.canDeleteDept}
                    />
                )}
            </main>
        </div>
    );
}

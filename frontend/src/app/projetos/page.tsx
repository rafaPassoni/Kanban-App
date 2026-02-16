"use client";
import React, { useCallback, useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "@/app/components/Navbar";
import AuthService from "@/services/auth";
import AccessService from "@/services/access";
import { API_TASKS, API_COLLABORATORS } from "@/constants/api";
import DateInputBRNative, { isoToBR } from "@/app/components/DateInputBRNative";
import {
    Plus,
    Pencil,
    Trash,
    X,
    Users,
    FolderOpen,
} from "lucide-react";

// ====================
// Tipos
// ====================
interface Responsavel {
    id?: number;
    name: string;
    email: string;
    position: string;
    is_active?: boolean;
}

interface Projeto {
    id?: number;
    title: string;
    description?: string;
    status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    responsavel: number | null;
    responsavel_name?: string;
    start_date?: string | null;
    deadline?: string | null;
    order: number;
    created_at?: string;
    updated_at?: string;
}

type ModalResp =
    | { type: null }
    | { type: "add" }
    | { type: "edit"; id: number }
    | { type: "delete"; id: number; name?: string };

type ModalProj =
    | { type: null }
    | { type: "add" }
    | { type: "edit"; id: number }
    | { type: "delete"; id: number; title?: string };

// ====================
// Constantes
// ====================
const STATUS_LABELS: Record<string, string> = {
    TODO: "A Fazer",
    IN_PROGRESS: "Em Progresso",
    IN_REVIEW: "Em Revisão",
    DONE: "Concluído",
};
const STATUS_COLORS: Record<string, string> = {
    TODO: "bg-slate-600/20 text-slate-300 border-slate-600/40",
    IN_PROGRESS: "bg-blue-600/20 text-blue-300 border-blue-600/40",
    IN_REVIEW: "bg-yellow-600/20 text-yellow-300 border-yellow-600/40",
    DONE: "bg-emerald-600/20 text-emerald-300 border-emerald-600/40",
};
const PRIORITY_LABELS: Record<string, string> = {
    LOW: "Baixa",
    MEDIUM: "Média",
    HIGH: "Alta",
    URGENT: "Urgente",
};
const PRIORITY_COLORS: Record<string, string> = {
    LOW: "bg-slate-600/20 text-slate-300 border-slate-600/40",
    MEDIUM: "bg-blue-600/20 text-blue-300 border-blue-600/40",
    HIGH: "bg-orange-600/20 text-orange-300 border-orange-600/40",
    URGENT: "bg-red-600/20 text-red-300 border-red-600/40",
};

const PRIORITY_ORDER: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

const EMPTY_RESP: Responsavel = { name: "", email: "", position: "" };
const EMPTY_PROJ: Omit<Projeto, "id" | "created_at" | "updated_at"> = {
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    responsavel: null,
    start_date: null,
    deadline: null,
    order: 0,
};

// ====================
// Página
// ====================
export default function ProjetosPage() {
    const [activeTab, setActiveTab] = useState<"responsaveis" | "projetos">("projetos");

    // -------- Auth
    const authedFetch = useCallback(
        async (url: string, options?: RequestInit) => {
            return AuthService.fetchWithAuth(url, options);
        },
        [],
    );

    // -------- Permissões
    const [canAddResp, setCanAddResp] = useState(false);
    const [canEditResp, setCanEditResp] = useState(false);
    const [canDeleteResp, setCanDeleteResp] = useState(false);
    const [canAddProj, setCanAddProj] = useState(false);
    const [canEditProj, setCanEditProj] = useState(false);
    const [canDeleteProj, setCanDeleteProj] = useState(false);
    useEffect(() => {
        AccessService.getUserPermissions().then((p) => {
            setCanAddResp(AccessService.has(p, "add", "collaborator"));
            setCanEditResp(AccessService.has(p, "change", "collaborator"));
            setCanDeleteResp(AccessService.has(p, "delete", "collaborator"));
            setCanAddProj(AccessService.has(p, "add", "task"));
            setCanEditProj(AccessService.has(p, "change", "task"));
            setCanDeleteProj(AccessService.has(p, "delete", "task"));
        });
    }, []);

    // -------- Dados Responsáveis
    const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
    const [modalResp, setModalResp] = useState<ModalResp>({ type: null });
    const [formResp, setFormResp] = useState<Responsavel>(EMPTY_RESP);
    const [loadingResp, setLoadingResp] = useState(true);

    const fetchResponsaveis = useCallback(async () => {
        try {
            const res = await authedFetch(`${API_COLLABORATORS}/?is_active=true`);
            if (res.ok) {
                const data = await res.json();
                setResponsaveis(data);
            }
        } catch {
            toast.error("Erro ao carregar responsáveis.");
        } finally {
            setLoadingResp(false);
        }
    }, [authedFetch]);

    useEffect(() => { fetchResponsaveis(); }, [fetchResponsaveis]);

    // -------- Dados Projetos
    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [modalProj, setModalProj] = useState<ModalProj>({ type: null });
    const [formProj, setFormProj] = useState(EMPTY_PROJ);
    const [loadingProj, setLoadingProj] = useState(true);

    const fetchProjetos = useCallback(async () => {
        try {
            const res = await authedFetch(`${API_TASKS}/`);
            if (res.ok) {
                const data: Projeto[] = await res.json();
                const sorted = [...data].sort(
                    (a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9),
                );
                setProjetos(sorted);
            }
        } catch {
            toast.error("Erro ao carregar projetos.");
        } finally {
            setLoadingProj(false);
        }
    }, [authedFetch]);

    useEffect(() => { fetchProjetos(); }, [fetchProjetos]);

    // -------- Handlers Responsáveis
    const openAddResp = () => { setFormResp(EMPTY_RESP); setModalResp({ type: "add" }); };
    const openEditResp = (r: Responsavel) => {
        setFormResp({ name: r.name, email: r.email, position: r.position || "" });
        setModalResp({ type: "edit", id: r.id! });
    };
    const openDeleteResp = (r: Responsavel) => {
        setModalResp({ type: "delete", id: r.id!, name: r.name });
    };

    const saveResp = async () => {
        if (!formResp.name.trim()) { toast.warning("Nome é obrigatório."); return; }
        if (!formResp.email.trim()) { toast.warning("Email é obrigatório."); return; }

        const body = { name: formResp.name, email: formResp.email, position: formResp.position };

        try {
            if (modalResp.type === "add") {
                const res = await authedFetch(`${API_COLLABORATORS}/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
                if (res.ok) {
                    toast.success("Responsável criado!");
                    setModalResp({ type: null });
                    fetchResponsaveis();
                } else {
                    const err = await res.json().catch(() => null);
                    toast.error(err?.email?.[0] || "Erro ao criar responsável.");
                }
            } else if (modalResp.type === "edit") {
                const res = await authedFetch(`${API_COLLABORATORS}/${modalResp.id}/`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
                if (res.ok) {
                    toast.success("Responsável atualizado!");
                    setModalResp({ type: null });
                    fetchResponsaveis();
                    fetchProjetos();
                } else {
                    toast.error("Erro ao atualizar responsável.");
                }
            }
        } catch {
            toast.error("Erro de conexão.");
        }
    };

    const deleteResp = async () => {
        if (modalResp.type !== "delete") return;
        try {
            const res = await authedFetch(`${API_COLLABORATORS}/${modalResp.id}/`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Responsável removido!");
                setModalResp({ type: null });
                fetchResponsaveis();
            } else {
                toast.error("Erro ao remover responsável.");
            }
        } catch {
            toast.error("Erro de conexão.");
        }
    };

    // -------- Handlers Projetos
    const openAddProj = () => { setFormProj({ ...EMPTY_PROJ }); setModalProj({ type: "add" }); };
    const openEditProj = (p: Projeto) => {
        setFormProj({
            title: p.title,
            description: p.description || "",
            status: p.status,
            priority: p.priority,
            responsavel: p.responsavel,
            start_date: p.start_date || null,
            deadline: p.deadline || null,
            order: p.order,
        });
        setModalProj({ type: "edit", id: p.id! });
    };
    const openDeleteProj = (p: Projeto) => {
        setModalProj({ type: "delete", id: p.id!, title: p.title });
    };

    const saveProj = async () => {
        if (!formProj.title.trim()) { toast.warning("Nome do projeto é obrigatório."); return; }

        const body: Record<string, unknown> = {
            title: formProj.title,
            description: formProj.description || "",
            status: formProj.status,
            priority: formProj.priority,
            responsavel: formProj.responsavel,
            start_date: formProj.start_date || null,
            deadline: formProj.deadline || null,
            order: formProj.order,
        };

        try {
            if (modalProj.type === "add") {
                const res = await authedFetch(`${API_TASKS}/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
                if (res.ok) {
                    toast.success("Projeto criado!");
                    setModalProj({ type: null });
                    fetchProjetos();
                } else {
                    toast.error("Erro ao criar projeto.");
                }
            } else if (modalProj.type === "edit") {
                const res = await authedFetch(`${API_TASKS}/${modalProj.id}/`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
                if (res.ok) {
                    toast.success("Projeto atualizado!");
                    setModalProj({ type: null });
                    fetchProjetos();
                } else {
                    toast.error("Erro ao atualizar projeto.");
                }
            }
        } catch {
            toast.error("Erro de conexão.");
        }
    };

    const deleteProj = async () => {
        if (modalProj.type !== "delete") return;
        try {
            const res = await authedFetch(`${API_TASKS}/${modalProj.id}/`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Projeto removido!");
                setModalProj({ type: null });
                fetchProjetos();
            } else {
                toast.error("Erro ao remover projeto.");
            }
        } catch {
            toast.error("Erro de conexão.");
        }
    };

    // -------- Render
    return (
        <div className="min-h-screen">
            <Navbar />
            <ToastContainer position="top-right" theme="dark" autoClose={3000} />

            <main className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-6">
                {/* Cabeçalho */}
                <div className="flex items-center gap-3 mb-6">
                    <FolderOpen className="h-8 w-8 text-blue-400" />
                    <h1 className="text-2xl font-semibold text-slate-50">Projetos</h1>
                </div>

                {/* Abas */}
                <div className="flex items-center gap-2 mb-6">
                    <button
                        type="button"
                        onClick={() => setActiveTab("projetos")}
                        className={[
                            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer",
                            activeTab === "projetos"
                                ? "bg-blue-600/20 text-blue-300 border border-blue-500/40"
                                : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-slate-200 hover:border-slate-600",
                        ].join(" ")}
                    >
                        <FolderOpen className="h-4 w-4" />
                        Projetos
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("responsaveis")}
                        className={[
                            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer",
                            activeTab === "responsaveis"
                                ? "bg-blue-600/20 text-blue-300 border border-blue-500/40"
                                : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-slate-200 hover:border-slate-600",
                        ].join(" ")}
                    >
                        <Users className="h-4 w-4" />
                        Responsáveis
                    </button>
                </div>

                {/* ==================== SUB-ABA RESPONSÁVEIS ==================== */}
                {activeTab === "responsaveis" && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-100">Responsáveis</h2>
                            {canAddResp && (
                                <button
                                    type="button"
                                    onClick={openAddResp}
                                    className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors cursor-pointer"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden sm:inline">Adicionar</span>
                                </button>
                            )}
                        </div>

                        {loadingResp ? (
                            <div className="text-center py-12 text-slate-400">Carregando...</div>
                        ) : responsaveis.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">Nenhum responsável cadastrado.</div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-slate-800/70">
                                <table className="w-full text-sm min-w-100">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-900/50">
                                            <th className="text-left px-4 py-3 font-medium text-slate-400">Nome</th>
                                            <th className="text-left px-4 py-3 font-medium text-slate-400">Email</th>
                                            <th className="text-left px-4 py-3 font-medium text-slate-400 hidden sm:table-cell">Cargo</th>
                                            <th className="text-right px-4 py-3 font-medium text-slate-400">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {responsaveis.map((r) => (
                                            <tr key={r.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                                <td className="px-4 py-3 text-slate-200">{r.name}</td>
                                                <td className="px-4 py-3 text-slate-400">{r.email}</td>
                                                <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{r.position || "—"}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {canEditResp && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditResp(r)}
                                                                className="p-2 rounded-lg text-slate-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors cursor-pointer"
                                                                title="Editar"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        {canDeleteResp && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openDeleteResp(r)}
                                                                className="p-2 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                                                                title="Excluir"
                                                            >
                                                                <Trash className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ==================== SUB-ABA PROJETOS ==================== */}
                {activeTab === "projetos" && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-100">Projetos</h2>
                            {canAddProj && (
                                <button
                                    type="button"
                                    onClick={openAddProj}
                                    className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors cursor-pointer"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden sm:inline">Adicionar</span>
                                </button>
                            )}
                        </div>

                        {loadingProj ? (
                            <div className="text-center py-12 text-slate-400">Carregando...</div>
                        ) : projetos.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">Nenhum projeto cadastrado.</div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-slate-800/70">
                                <table className="w-full text-sm min-w-150">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-900/50">
                                            <th className="text-left px-4 py-3 font-medium text-slate-400">Nome</th>
                                            <th className="text-left px-4 py-3 font-medium text-slate-400">Responsável</th>
                                            <th className="text-left px-4 py-3 font-medium text-slate-400">Status</th>
                                            <th className="text-left px-4 py-3 font-medium text-slate-400 hidden md:table-cell">Prioridade</th>
                                            <th className="text-left px-4 py-3 font-medium text-slate-400 hidden md:table-cell">Data Início</th>
                                            <th className="text-left px-4 py-3 font-medium text-slate-400 hidden md:table-cell">Data Prazo</th>
                                            <th className="text-right px-4 py-3 font-medium text-slate-400">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {projetos.map((p) => (
                                            <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                                <td className="px-4 py-3 text-slate-200 font-medium">{p.title}</td>
                                                <td className="px-4 py-3 text-slate-400">{p.responsavel_name || "—"}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium border ${STATUS_COLORS[p.status]}`}>
                                                        {STATUS_LABELS[p.status]}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 hidden md:table-cell">
                                                    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium border ${PRIORITY_COLORS[p.priority]}`}>
                                                        {PRIORITY_LABELS[p.priority]}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{isoToBR(p.start_date || undefined) || "—"}</td>
                                                <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{isoToBR(p.deadline || undefined) || "—"}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {canEditProj && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditProj(p)}
                                                                className="p-2 rounded-lg text-slate-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors cursor-pointer"
                                                                title="Editar"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        {canDeleteProj && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openDeleteProj(p)}
                                                                className="p-2 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                                                                title="Excluir"
                                                            >
                                                                <Trash className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* ==================== MODAIS RESPONSÁVEIS ==================== */}
            {(modalResp.type === "add" || modalResp.type === "edit") && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl border border-slate-700/80 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-semibold text-slate-100">
                                {modalResp.type === "add" ? "Novo Responsável" : "Editar Responsável"}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setModalResp({ type: null })}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome *</label>
                                <input
                                    value={formResp.name}
                                    onChange={(e) => setFormResp({ ...formResp, name: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Nome do responsável"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email *</label>
                                <input
                                    type="email"
                                    value={formResp.email}
                                    onChange={(e) => setFormResp({ ...formResp, email: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="email@exemplo.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Cargo</label>
                                <input
                                    value={formResp.position}
                                    onChange={(e) => setFormResp({ ...formResp, position: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Cargo ou função"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setModalResp({ type: null })}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={saveResp}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer"
                            >
                                {modalResp.type === "add" ? "Criar" : "Salvar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalResp.type === "delete" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm rounded-2xl border border-slate-700/80 bg-slate-900 p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold text-slate-100 mb-3">Confirmar exclusão</h3>
                        <p className="text-sm text-slate-400 mb-6">
                            Tem certeza que deseja excluir <strong className="text-slate-200">{modalResp.name}</strong>?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setModalResp({ type: null })}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={deleteResp}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-500 transition-colors cursor-pointer"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== MODAIS PROJETOS ==================== */}
            {(modalProj.type === "add" || modalProj.type === "edit") && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg rounded-2xl border border-slate-700/80 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-semibold text-slate-100">
                                {modalProj.type === "add" ? "Novo Projeto" : "Editar Projeto"}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setModalProj({ type: null })}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Nome */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome *</label>
                                <input
                                    value={formProj.title}
                                    onChange={(e) => setFormProj({ ...formProj, title: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Nome do projeto"
                                />
                            </div>

                            {/* Responsável */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Responsável</label>
                                <select
                                    value={formProj.responsavel ?? ""}
                                    onChange={(e) => setFormProj({ ...formProj, responsavel: e.target.value ? Number(e.target.value) : null })}
                                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Selecione...</option>
                                    {responsaveis.map((r) => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Status + Prioridade */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
                                    <select
                                        value={formProj.status}
                                        onChange={(e) => setFormProj({ ...formProj, status: e.target.value as Projeto["status"] })}
                                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="TODO">A Fazer</option>
                                        <option value="IN_PROGRESS">Em Progresso</option>
                                        <option value="IN_REVIEW">Em Revisão</option>
                                        <option value="DONE">Concluído</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Prioridade</label>
                                    <select
                                        value={formProj.priority}
                                        onChange={(e) => setFormProj({ ...formProj, priority: e.target.value as Projeto["priority"] })}
                                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="LOW">Baixa</option>
                                        <option value="MEDIUM">Média</option>
                                        <option value="HIGH">Alta</option>
                                        <option value="URGENT">Urgente</option>
                                    </select>
                                </div>
                            </div>

                            {/* Datas */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <DateInputBRNative
                                    label="Data Início"
                                    valueISO={formProj.start_date || ""}
                                    onChangeISO={(v) => setFormProj({ ...formProj, start_date: v || null })}
                                />
                                <DateInputBRNative
                                    label="Data Prazo"
                                    valueISO={formProj.deadline || ""}
                                    onChangeISO={(v) => setFormProj({ ...formProj, deadline: v || null })}
                                />
                            </div>

                            {/* Descrição */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Descrição</label>
                                <textarea
                                    value={formProj.description || ""}
                                    onChange={(e) => setFormProj({ ...formProj, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    placeholder="Descrição do projeto (opcional)"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setModalProj({ type: null })}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={saveProj}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer"
                            >
                                {modalProj.type === "add" ? "Criar" : "Salvar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalProj.type === "delete" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm rounded-2xl border border-slate-700/80 bg-slate-900 p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold text-slate-100 mb-3">Confirmar exclusão</h3>
                        <p className="text-sm text-slate-400 mb-6">
                            Tem certeza que deseja excluir o projeto <strong className="text-slate-200">{modalProj.title}</strong>?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setModalProj({ type: null })}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={deleteProj}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-500 transition-colors cursor-pointer"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

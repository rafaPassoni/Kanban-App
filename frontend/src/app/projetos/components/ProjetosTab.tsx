"use client";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Plus, Pencil, Trash, X } from "lucide-react";
import { API_PROJECTS, API_COLLABORATORS, API_DEPARTMENTS } from "@/constants/api";
import { extractResults } from "@/lib/api";
import type { Projeto, Responsavel, Setor, ModalProj } from "../types";
import { EMPTY_PROJ } from "../types";
import DeleteModal from "./DeleteModal";
import MultiSelectDropdown from "./MultiSelectDropdown";

interface ProjetosTabProps {
    authedFetch: (url: string, options?: RequestInit) => Promise<Response>;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
}

export default function ProjetosTab({ authedFetch, canAdd, canEdit, canDelete }: ProjetosTabProps) {
    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
    const [setores, setSetores] = useState<Setor[]>([]);
    const [modal, setModal] = useState<ModalProj>({ type: null });
    const [form, setForm] = useState(EMPTY_PROJ);
    const [loading, setLoading] = useState(true);

    const fetchProjetos = useCallback(async () => {
        try {
            const res = await authedFetch(`${API_PROJECTS}/`);
            if (res.ok) setProjetos(extractResults<Projeto>(await res.json()));
        } catch {
            toast.error("Erro ao carregar projetos.");
        } finally {
            setLoading(false);
        }
    }, [authedFetch]);

    const fetchRefs = useCallback(async () => {
        const [respRes, deptRes] = await Promise.all([
            authedFetch(`${API_COLLABORATORS}/?is_active=true`),
            authedFetch(`${API_DEPARTMENTS}/?is_active=true`),
        ]);
        if (respRes.ok) setResponsaveis(extractResults<Responsavel>(await respRes.json()));
        if (deptRes.ok) setSetores(extractResults<Setor>(await deptRes.json()));
    }, [authedFetch]);

    useEffect(() => { fetchProjetos(); fetchRefs(); }, [fetchProjetos, fetchRefs]);

    const save = async () => {
        if (!form.name.trim()) { toast.warning("Nome do projeto é obrigatório."); return; }
        const body = {
            name: form.name,
            description: form.description || "",
            responsible_collaborators: form.responsible_collaborators,
            used_by_departments: form.used_by_departments,
        };
        try {
            if (modal.type === "add") {
                const res = await authedFetch(`${API_PROJECTS}/`, {
                    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
                });
                if (res.ok) { toast.success("Projeto criado!"); setModal({ type: null }); fetchProjetos(); }
                else toast.error("Erro ao criar projeto.");
            } else if (modal.type === "edit") {
                const res = await authedFetch(`${API_PROJECTS}/${modal.id}/`, {
                    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
                });
                if (res.ok) { toast.success("Projeto atualizado!"); setModal({ type: null }); fetchProjetos(); }
                else toast.error("Erro ao atualizar projeto.");
            }
        } catch { toast.error("Erro de conexão."); }
    };

    const remove = async () => {
        if (modal.type !== "delete") return;
        try {
            const res = await authedFetch(`${API_PROJECTS}/${modal.id}/`, { method: "DELETE" });
            if (res.ok) { toast.success("Projeto removido!"); setModal({ type: null }); fetchProjetos(); }
            else toast.error("Erro ao remover projeto.");
        } catch { toast.error("Erro de conexão."); }
    };

    const openEdit = (p: Projeto) => {
        setForm({
            name: p.name,
            description: p.description || "",
            responsible_collaborators: p.responsible_collaborators || [],
            used_by_departments: p.used_by_departments || [],
        });
        setModal({ type: "edit", id: p.id! });
    };

    return (
        <>
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-100">Projetos</h2>
                    {canAdd && (
                        <button type="button" onClick={() => { setForm({ ...EMPTY_PROJ }); setModal({ type: "add" }); }} className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors cursor-pointer">
                            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Adicionar</span>
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-12 text-slate-400">Carregando...</div>
                ) : projetos.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">Nenhum projeto cadastrado.</div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-800/70">
                        <table className="w-full text-sm min-w-100">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-900/50">
                                    <th className="text-left px-4 py-3 font-medium text-slate-400">Nome</th>
                                    <th className="text-left px-4 py-3 font-medium text-slate-400 hidden sm:table-cell">Descrição</th>
                                    <th className="text-left px-4 py-3 font-medium text-slate-400 hidden md:table-cell">Responsáveis</th>
                                    <th className="text-left px-4 py-3 font-medium text-slate-400 hidden md:table-cell">Setores</th>
                                    <th className="text-right px-4 py-3 font-medium text-slate-400">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projetos.map((p) => (
                                    <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                        <td className="px-4 py-3 text-slate-200 font-medium">{p.name}</td>
                                        <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{p.description || "\u2014"}</td>
                                        <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{p.responsible_collaborators_names?.join(", ") || "\u2014"}</td>
                                        <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{p.used_by_departments_names?.join(", ") || "\u2014"}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {canEdit && (
                                                    <button type="button" onClick={() => openEdit(p)} className="p-2 rounded-lg text-slate-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors cursor-pointer" title="Editar"><Pencil className="h-4 w-4" /></button>
                                                )}
                                                {canDelete && (
                                                    <button type="button" onClick={() => setModal({ type: "delete", id: p.id!, name: p.name })} className="p-2 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer" title="Excluir"><Trash className="h-4 w-4" /></button>
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

            {/* Add/Edit Modal */}
            {(modal.type === "add" || modal.type === "edit") && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg rounded-2xl border border-slate-700/80 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-semibold text-slate-100">{modal.type === "add" ? "Novo Projeto" : "Editar Projeto"}</h3>
                            <button type="button" onClick={() => setModal({ type: null })} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome *</label>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Nome do projeto" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Descrição</label>
                                <textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" placeholder="Descrição do projeto (opcional)" />
                            </div>
                            {responsaveis.length > 0 && (
                                <MultiSelectDropdown
                                    label="Responsáveis"
                                    items={responsaveis.filter((r): r is Responsavel & { id: number } => r.id !== undefined)}
                                    selectedIds={form.responsible_collaborators}
                                    onChange={(ids) => setForm({ ...form, responsible_collaborators: ids })}
                                />
                            )}
                            {setores.length > 0 && (
                                <MultiSelectDropdown
                                    label="Setores"
                                    items={setores.filter((s): s is Setor & { id: number } => s.id !== undefined)}
                                    selectedIds={form.used_by_departments}
                                    onChange={(ids) => setForm({ ...form, used_by_departments: ids })}
                                />
                            )}
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button type="button" onClick={() => setModal({ type: null })} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer">Cancelar</button>
                            <button type="button" onClick={save} className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer">{modal.type === "add" ? "Criar" : "Salvar"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {modal.type === "delete" && (
                <DeleteModal title="o projeto" itemName={modal.name} onConfirm={remove} onCancel={() => setModal({ type: null })} />
            )}
        </>
    );
}

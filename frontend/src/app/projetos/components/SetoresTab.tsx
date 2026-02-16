"use client";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Plus, Pencil, Trash, X } from "lucide-react";
import { API_DEPARTMENTS } from "@/constants/api";
import { extractResults } from "@/lib/api";
import type { Setor, ModalSetor } from "../types";
import { EMPTY_SETOR } from "../types";
import DeleteModal from "./DeleteModal";

interface SetoresTabProps {
    authedFetch: (url: string, options?: RequestInit) => Promise<Response>;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
    onDataChange?: () => void;
}

export default function SetoresTab({ authedFetch, canAdd, canEdit, canDelete, onDataChange }: SetoresTabProps) {
    const [setores, setSetores] = useState<Setor[]>([]);
    const [modal, setModal] = useState<ModalSetor>({ type: null });
    const [form, setForm] = useState(EMPTY_SETOR);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const res = await authedFetch(`${API_DEPARTMENTS}/?is_active=true`);
            if (res.ok) setSetores(extractResults<Setor>(await res.json()));
        } catch {
            toast.error("Erro ao carregar setores.");
        } finally {
            setLoading(false);
        }
    }, [authedFetch]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const save = async () => {
        if (!form.name.trim()) { toast.warning("Nome do setor é obrigatório."); return; }
        const body = { name: form.name, description: form.description || "", department_type: "main" };
        try {
            if (modal.type === "add") {
                const res = await authedFetch(`${API_DEPARTMENTS}/`, {
                    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
                });
                if (res.ok) { toast.success("Setor criado!"); setModal({ type: null }); fetchData(); onDataChange?.(); }
                else toast.error("Erro ao criar setor.");
            } else if (modal.type === "edit") {
                const res = await authedFetch(`${API_DEPARTMENTS}/${modal.id}/`, {
                    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
                });
                if (res.ok) { toast.success("Setor atualizado!"); setModal({ type: null }); fetchData(); onDataChange?.(); }
                else toast.error("Erro ao atualizar setor.");
            }
        } catch { toast.error("Erro de conexão."); }
    };

    const remove = async () => {
        if (modal.type !== "delete") return;
        try {
            const res = await authedFetch(`${API_DEPARTMENTS}/${modal.id}/`, { method: "DELETE" });
            if (res.ok) { toast.success("Setor removido!"); setModal({ type: null }); fetchData(); onDataChange?.(); }
            else toast.error("Erro ao remover setor.");
        } catch { toast.error("Erro de conexão."); }
    };

    return (
        <>
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-100">Setores</h2>
                    {canAdd && (
                        <button type="button" onClick={() => { setForm({ ...EMPTY_SETOR }); setModal({ type: "add" }); }} className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors cursor-pointer">
                            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Adicionar</span>
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-12 text-slate-400">Carregando...</div>
                ) : setores.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">Nenhum setor cadastrado.</div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-800/70">
                        <table className="w-full text-sm min-w-100">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-900/50">
                                    <th className="text-left px-4 py-3 font-medium text-slate-400">Nome</th>
                                    <th className="text-left px-4 py-3 font-medium text-slate-400 hidden sm:table-cell">Descrição</th>
                                    <th className="text-right px-4 py-3 font-medium text-slate-400">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {setores.map((s) => (
                                    <tr key={s.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                        <td className="px-4 py-3 text-slate-200">{s.name}</td>
                                        <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{s.description || "\u2014"}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {canEdit && (
                                                    <button type="button" onClick={() => { setForm({ name: s.name, description: s.description || "" }); setModal({ type: "edit", id: s.id! }); }} className="p-2 rounded-lg text-slate-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors cursor-pointer" title="Editar"><Pencil className="h-4 w-4" /></button>
                                                )}
                                                {canDelete && (
                                                    <button type="button" onClick={() => setModal({ type: "delete", id: s.id!, name: s.name })} className="p-2 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer" title="Excluir"><Trash className="h-4 w-4" /></button>
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
                    <div className="w-full max-w-md rounded-2xl border border-slate-700/80 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-semibold text-slate-100">{modal.type === "add" ? "Novo Setor" : "Editar Setor"}</h3>
                            <button type="button" onClick={() => setModal({ type: null })} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome *</label>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Nome do setor" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Descrição</label>
                                <textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" placeholder="Descrição do setor (opcional)" />
                            </div>
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
                <DeleteModal title="o setor" itemName={modal.name} onConfirm={remove} onCancel={() => setModal({ type: null })} />
            )}
        </>
    );
}

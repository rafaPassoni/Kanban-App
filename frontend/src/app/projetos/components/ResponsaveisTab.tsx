"use client";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Plus, Pencil, Trash, X } from "lucide-react";
import { API_COLLABORATORS } from "@/constants/api";
import { extractResults } from "@/lib/api";
import type { Responsavel, ModalResp } from "../types";
import { EMPTY_RESP } from "../types";
import DeleteModal from "./DeleteModal";

interface ResponsaveisTabProps {
    authedFetch: (url: string, options?: RequestInit) => Promise<Response>;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
}

export default function ResponsaveisTab({ authedFetch, canAdd, canEdit, canDelete }: ResponsaveisTabProps) {
    const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
    const [modal, setModal] = useState<ModalResp>({ type: null });
    const [form, setForm] = useState<Responsavel>(EMPTY_RESP);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const res = await authedFetch(`${API_COLLABORATORS}/?is_active=true`);
            if (res.ok) setResponsaveis(extractResults<Responsavel>(await res.json()));
        } catch {
            toast.error("Erro ao carregar responsáveis.");
        } finally {
            setLoading(false);
        }
    }, [authedFetch]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const save = async () => {
        if (!form.name.trim()) { toast.warning("Nome é obrigatório."); return; }
        if (!form.email.trim()) { toast.warning("Email é obrigatório."); return; }
        const body = { name: form.name, email: form.email, position: form.position };
        try {
            if (modal.type === "add") {
                const res = await authedFetch(`${API_COLLABORATORS}/`, {
                    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
                });
                if (res.ok) { toast.success("Responsável criado!"); setModal({ type: null }); fetchData(); }
                else { const err = await res.json().catch(() => null); toast.error(err?.email?.[0] || "Erro ao criar responsável."); }
            } else if (modal.type === "edit") {
                const res = await authedFetch(`${API_COLLABORATORS}/${modal.id}/`, {
                    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
                });
                if (res.ok) { toast.success("Responsável atualizado!"); setModal({ type: null }); fetchData(); }
                else toast.error("Erro ao atualizar responsável.");
            }
        } catch { toast.error("Erro de conexão."); }
    };

    const remove = async () => {
        if (modal.type !== "delete") return;
        try {
            const res = await authedFetch(`${API_COLLABORATORS}/${modal.id}/`, { method: "DELETE" });
            if (res.ok) { toast.success("Responsável removido!"); setModal({ type: null }); fetchData(); }
            else toast.error("Erro ao remover responsável.");
        } catch { toast.error("Erro de conexão."); }
    };

    return (
        <>
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-100">Responsáveis</h2>
                    {canAdd && (
                        <button type="button" onClick={() => { setForm(EMPTY_RESP); setModal({ type: "add" }); }} className="btn-add">
                            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Adicionar</span>
                        </button>
                    )}
                </div>

                {loading ? (
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
                                        <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{r.position || "\u2014"}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {canEdit && (
                                                    <button type="button" onClick={() => { setForm({ name: r.name, email: r.email, position: r.position || "" }); setModal({ type: "edit", id: r.id! }); }} className="p-3 sm:p-2 rounded-lg text-slate-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors cursor-pointer" title="Editar"><Pencil className="h-4 w-4" /></button>
                                                )}
                                                {canDelete && (
                                                    <button type="button" onClick={() => setModal({ type: "delete", id: r.id!, name: r.name })} className="p-3 sm:p-2 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer" title="Excluir"><Trash className="h-4 w-4" /></button>
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
                <div className="modal-overlay">
                    <div className="w-full max-w-md rounded-2xl border border-slate-700/80 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-semibold text-slate-100">{modal.type === "add" ? "Novo Responsável" : "Editar Responsável"}</h3>
                            <button type="button" onClick={() => setModal({ type: null })} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome *</label>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Nome do responsável" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email *</label>
                                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="email@exemplo.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Cargo</label>
                                <input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="input-field" placeholder="Cargo ou função" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button type="button" onClick={() => setModal({ type: null })} className="btn-cancel">Cancelar</button>
                            <button type="button" onClick={save} className="btn-primary">{modal.type === "add" ? "Criar" : "Salvar"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {modal.type === "delete" && (
                <DeleteModal title="" itemName={modal.name} onConfirm={remove} onCancel={() => setModal({ type: null })} />
            )}
        </>
    );
}

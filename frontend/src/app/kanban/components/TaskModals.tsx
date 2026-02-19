"use client";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { ChevronDown, X } from "lucide-react";
import DateInputBRNative from "@/app/components/DateInputBRNative";
import type { Task, Modal, Collaborator, Department, Project } from "../types";
import { PRIORITY_LABELS, STATUS_LABELS, EMPTY_FORM } from "../constants";

interface TaskModalsProps {
    modal: Modal;
    setModal: (m: Modal) => void;
    tasks: Task[];
    projects: Project[];
    collaborators: Collaborator[];
    departments: Department[];
    addTask: (payload: Omit<Task, "id" | "created_at" | "updated_at">) => Promise<Task | null>;
    updateTask: (id: number, payload: Partial<Task>) => Promise<void>;
    deleteTask: (id: number) => Promise<void>;
    reopenModal: { open: boolean; taskId: number | null; nextStatus: Task["status"] | null };
    setReopenModal: (v: { open: boolean; taskId: number | null; nextStatus: Task["status"] | null }) => void;
    doneModal: { open: boolean; taskId: number | null; solution: string };
    setDoneModal: (v: { open: boolean; taskId: number | null; solution: string }) => void;
    solutionModal: { open: boolean; taskId: number | null; solution: string };
    setSolutionModal: (v: { open: boolean; taskId: number | null; solution: string }) => void;
}

export default function TaskModals({
    modal, setModal, tasks, projects, collaborators, departments,
    addTask, updateTask, deleteTask,
    reopenModal, setReopenModal,
    doneModal, setDoneModal,
    solutionModal, setSolutionModal,
}: TaskModalsProps) {
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [editForm, setEditForm] = useState(EMPTY_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAddPriorityOpen, setIsAddPriorityOpen] = useState(false);
    const [isEditStatusOpen, setIsEditStatusOpen] = useState(false);
    const [isEditPriorityOpen, setIsEditPriorityOpen] = useState(false);

    const addPriorityRef = useRef<HTMLDivElement | null>(null);
    const editStatusRef = useRef<HTMLDivElement | null>(null);
    const editPriorityRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (addPriorityRef.current && !addPriorityRef.current.contains(event.target as Node)) setIsAddPriorityOpen(false);
            if (editStatusRef.current && !editStatusRef.current.contains(event.target as Node)) setIsEditStatusOpen(false);
            if (editPriorityRef.current && !editPriorityRef.current.contains(event.target as Node)) setIsEditPriorityOpen(false);
        };
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            setIsAddPriorityOpen(false);
            setIsEditStatusOpen(false);
            setIsEditPriorityOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    useEffect(() => {
        if (modal.type !== "edit") return;
        const task = tasks.find((t) => t.id === modal.id);
        if (!task) return;
        setEditForm({
            title: task.title,
            description: task.description || "",
            solution: task.solution || "",
            status: task.status,
            priority: task.priority,
            project: task.project ?? null,
            responsavel: task.responsavel ?? null,
            assigned_to: task.assigned_to || [],
            department: task.department || [],
            order: task.order,
            start_date: task.start_date || null,
            deadline: task.deadline || null,
        });
    }, [modal, tasks]);

    const handleSubmitAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title) { toast.error("Nome é obrigatório!"); return; }
        setIsSubmitting(true);
        const result = await addTask(formData);
        setIsSubmitting(false);
        if (result) {
            setFormData(EMPTY_FORM);
            setModal({ type: null });
            toast.success("Task criada com sucesso!");
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (modal.type !== "edit") return;
        if (editForm.status === "DONE" && !editForm.solution?.trim()) {
            toast.error("Informe a solução antes de concluir a task.");
            return;
        }
        setIsSubmitting(true);
        await updateTask(modal.id, editForm);
        setIsSubmitting(false);
        setModal({ type: null });
        toast.success("Task atualizada com sucesso!");
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const dropdownBtnClass = "peer w-full rounded-xl border border-slate-700/80 bg-gradient-to-b from-slate-900/95 to-slate-900/80 py-2.5 pl-3 pr-10 text-left text-sm font-normal text-slate-100 shadow-sm shadow-slate-950/30 transition-all duration-150 cursor-pointer hover:border-blue-500/80 hover:shadow-blue-900/20 focus:outline-none focus:ring-0 focus:border-blue-500/80 focus:shadow-blue-900/20";
    const dropdownListClass = "absolute z-30 mt-0.5 w-full overflow-hidden rounded-xl border border-slate-600/90 bg-slate-900/95 shadow-xl shadow-black/40 backdrop-blur-sm";

    const accentStyles: Record<string, { available: string; selected: string; container: string }> = {
        blue: {
            available: "hover:border-blue-500",
            selected: "bg-blue-900/40 border-blue-600/60 text-blue-200 hover:bg-blue-800/50 hover:border-blue-500",
            container: "border-blue-600/50",
        },
        emerald: {
            available: "hover:border-emerald-500",
            selected: "bg-emerald-900/40 border-emerald-600/60 text-emerald-200 hover:bg-emerald-800/50 hover:border-emerald-500",
            container: "border-emerald-600/50",
        },
    };

    const renderDragDropList = (
        items: { id: number; name: string }[],
        selectedIds: number[],
        setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>,
        dataKey: string,
        fieldName: "assigned_to" | "department",
        accentColor: string,
    ) => {
        const styles = accentStyles[accentColor] || accentStyles.blue;
        return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
                <p className="text-xs text-slate-400 mb-1.5">Disponíveis:</p>
                <div
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2 min-h-15 max-h-20 overflow-y-auto"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        const id = Number(e.dataTransfer.getData(dataKey));
                        setForm((prev) => ({ ...prev, [fieldName]: (prev[fieldName] || []).filter((x) => x !== id) }));
                    }}
                >
                    {items.filter((i) => !selectedIds.includes(i.id)).map((i) => (
                        <div
                            key={i.id}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData(dataKey, String(i.id))}
                            className={`px-2 py-1.5 mb-1.5 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200 cursor-move hover:bg-slate-700 ${styles.available} transition-colors`}
                        >
                            {i.name}
                        </div>
                    ))}
                    {items.filter((i) => !selectedIds.includes(i.id)).length === 0 && (
                        <p className="text-xs text-slate-500 text-center py-4">Todos selecionados</p>
                    )}
                </div>
            </div>
            <div>
                <p className="text-xs text-slate-400 mb-1.5">Selecionados:</p>
                <div
                    className={`bg-slate-900 border ${styles.container} rounded-lg p-2 min-h-15 max-h-20 overflow-y-auto`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        const id = Number(e.dataTransfer.getData(dataKey));
                        setForm((prev) => {
                            const current = prev[fieldName] || [];
                            if (current.includes(id)) return prev;
                            return { ...prev, [fieldName]: [...current, id] };
                        });
                    }}
                >
                    {selectedIds.map((id) => {
                        const item = items.find((i) => i.id === id);
                        return item ? (
                            <div
                                key={item.id}
                                draggable
                                onDragStart={(e) => e.dataTransfer.setData(dataKey, String(item.id))}
                                className={`px-2 py-1.5 mb-1.5 border rounded text-xs cursor-move ${styles.selected} transition-colors`}
                            >
                                {item.name}
                            </div>
                        ) : null;
                    })}
                    {selectedIds.length === 0 && (
                        <p className="text-xs text-slate-500 text-center py-4">Arraste aqui</p>
                    )}
                </div>
            </div>
        </div>
    );
    };

    return (
        <>
            {/* Modal: adicionar task */}
            {modal.type === "add" && (
                <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setModal({ type: null })}>
                    <div onClick={(e) => e.stopPropagation()} className="bg-slate-900/90 rounded-2xl p-4 sm:p-6 w-full max-w-lg border border-slate-700/80 shadow-xl max-h-screen overflow-y-auto">
                        <div className="mb-2">
                            <span className="text-xs uppercase tracking-wide text-slate-400">Nova task</span>
                            <h2 className="text-2xl font-semibold text-slate-100">Nova Task</h2>
                        </div>
                        <div className="h-px w-full bg-slate-700/70 mb-2" />
                        <form onSubmit={handleSubmitAdd} className="space-y-3 text-slate-100 text-sm">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Título:*</label>
                                <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Desenvolver funcionalidade de login" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Descrição:</label>
                                <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Ex: Implementar a funcionalidade de login." />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Projeto:</label>
                                    <select value={formData.project ?? ""} onChange={(e) => setFormData((prev) => ({ ...prev, project: e.target.value ? Number(e.target.value) : null }))} className="input-field">
                                        <option value="">Nenhum</option>
                                        {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Prioridade:</label>
                                    <div ref={addPriorityRef} className="group relative">
                                        <button type="button" onClick={() => setIsAddPriorityOpen((prev) => !prev)} aria-haspopup="listbox" aria-expanded={isAddPriorityOpen} className={dropdownBtnClass}>
                                            {PRIORITY_LABELS[formData.priority]}
                                        </button>
                                        <span className="dropdown-chevron">
                                            <ChevronDown className={`h-4 w-4 transition-transform duration-150 ${isAddPriorityOpen ? "rotate-180" : ""}`} />
                                        </span>
                                        {isAddPriorityOpen && (
                                            <div className={dropdownListClass}>
                                                <ul className="max-h-60 overflow-y-auto py-1" role="listbox">
                                                    {(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).map((p) => (
                                                        <li key={p}><button type="button" onClick={() => { setFormData((prev) => ({ ...prev, priority: p })); setIsAddPriorityOpen(false); }} className={`w-full px-3 py-2 text-left text-sm transition cursor-pointer ${formData.priority === p ? "bg-blue-600/90 text-white" : "text-slate-200 hover:bg-slate-800/90"}`}>{PRIORITY_LABELS[p]}</button></li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300">Responsáveis:</label>
                                {renderDragDropList(collaborators, formData.assigned_to || [], setFormData, "collaborator-id", "assigned_to", "blue")}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300">Setores:</label>
                                {renderDragDropList(departments, formData.department || [], setFormData, "department-id", "department", "emerald")}
                            </div>
                            <DateInputBRNative label="Prazo:" valueISO={formData.deadline || ""} onChangeISO={(iso) => setFormData((prev) => ({ ...prev, deadline: iso || null }))} openUp />
                            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-3">
                                <button type="button" onClick={() => setModal({ type: null })} className="px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-medium text-white cursor-pointer min-w-full sm:min-w-35">Cancelar</button>
                                <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white disabled:opacity-50 cursor-pointer min-w-full sm:min-w-30" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: editar task */}
            {modal.type === "edit" && (
                <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setModal({ type: null })}>
                    <div onClick={(e) => e.stopPropagation()} className="bg-slate-900/90 rounded-2xl p-4 sm:p-6 w-full max-w-lg border border-slate-700/80 shadow-xl max-h-screen overflow-y-auto">
                        <div className="mb-2">
                            <span className="text-xs uppercase tracking-wide text-slate-400">Editar task</span>
                            <h2 className="text-2xl font-semibold text-slate-100">Editar Task</h2>
                        </div>
                        <div className="h-px w-full bg-slate-700/70 mb-2" />
                        <form onSubmit={handleEditSubmit} className="space-y-3 text-slate-100 text-sm">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Título:*</label>
                                <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Descrição:</label>
                                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
                            </div>
                            {editForm.status === "DONE" && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Solução/Conclusão:*</label>
                                    <textarea value={editForm.solution || ""} onChange={(e) => setEditForm({ ...editForm, solution: e.target.value })} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} required />
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Status:</label>
                                    <div ref={editStatusRef} className="group relative">
                                        <button type="button" onClick={() => setIsEditStatusOpen((prev) => !prev)} aria-haspopup="listbox" aria-expanded={isEditStatusOpen} className={dropdownBtnClass}>
                                            {STATUS_LABELS[editForm.status]}
                                        </button>
                                        <span className="dropdown-chevron"><ChevronDown className={`h-4 w-4 transition-transform duration-150 ${isEditStatusOpen ? "rotate-180" : ""}`} /></span>
                                        {isEditStatusOpen && (
                                            <div className={dropdownListClass}>
                                                <ul className="max-h-60 overflow-y-auto py-1" role="listbox">
                                                    {(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const).map((s) => (
                                                        <li key={s}><button type="button" onClick={() => { setEditForm((prev) => ({ ...prev, status: s })); setIsEditStatusOpen(false); }} className={`w-full px-3 py-2 text-left text-sm transition cursor-pointer ${editForm.status === s ? "bg-blue-600/90 text-white" : "text-slate-200 hover:bg-slate-800/90"}`}>{STATUS_LABELS[s]}</button></li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Prioridade:</label>
                                    <div ref={editPriorityRef} className="group relative">
                                        <button type="button" onClick={() => setIsEditPriorityOpen((prev) => !prev)} aria-haspopup="listbox" aria-expanded={isEditPriorityOpen} className={dropdownBtnClass}>
                                            {PRIORITY_LABELS[editForm.priority]}
                                        </button>
                                        <span className="dropdown-chevron"><ChevronDown className={`h-4 w-4 transition-transform duration-150 ${isEditPriorityOpen ? "rotate-180" : ""}`} /></span>
                                        {isEditPriorityOpen && (
                                            <div className={dropdownListClass}>
                                                <ul className="max-h-60 overflow-y-auto py-1" role="listbox">
                                                    {(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).map((p) => (
                                                        <li key={p}><button type="button" onClick={() => { setEditForm((prev) => ({ ...prev, priority: p })); setIsEditPriorityOpen(false); }} className={`w-full px-3 py-2 text-left text-sm transition cursor-pointer ${editForm.priority === p ? "bg-blue-600/90 text-white" : "text-slate-200 hover:bg-slate-800/90"}`}>{PRIORITY_LABELS[p]}</button></li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Projeto:</label>
                                <select value={editForm.project ?? ""} onChange={(e) => setEditForm((prev) => ({ ...prev, project: e.target.value ? Number(e.target.value) : null }))} className="input-field">
                                    <option value="">Nenhum</option>
                                    {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300">Responsáveis:</label>
                                {renderDragDropList(collaborators, editForm.assigned_to || [], setEditForm, "collaborator-id", "assigned_to", "blue")}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300">Setores:</label>
                                {renderDragDropList(departments, editForm.department || [], setEditForm, "department-id", "department", "emerald")}
                            </div>
                            <DateInputBRNative label="Prazo:" valueISO={editForm.deadline || ""} onChangeISO={(iso) => setEditForm((prev) => ({ ...prev, deadline: iso || null }))} openUp />
                            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-3">
                                <button type="button" onClick={() => setModal({ type: null })} className="px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-medium text-white cursor-pointer min-w-full sm:min-w-35">Cancelar</button>
                                <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white disabled:opacity-50 cursor-pointer min-w-full sm:min-w-30" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar Alterações"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: excluir task */}
            {modal.type === "delete" && (
                <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setModal({ type: null })}>
                    <div onClick={(e) => e.stopPropagation()} className="bg-slate-900/90 rounded-2xl p-4 sm:p-6 w-full max-w-lg border border-slate-700/80 shadow-xl shadow-slate-950/60">
                        <div className="flex items-center justify-between gap-4 border-b border-slate-700/70 pb-2 mb-2">
                            <div className="flex flex-col">
                                <span className="text-xs uppercase tracking-wide text-red-400">Excluir task</span>
                                <h2 className="text-2xl font-semibold text-slate-100">Excluir Task</h2>
                            </div>
                        </div>
                        <p className="text-slate-200 text-sm mb-3">
                            Tem certeza que deseja excluir a task: <span className="font-semibold">{modal.title}</span>
                        </p>
                        <div className="flex gap-3 pt-3">
                            <button onClick={async () => { await deleteTask(modal.id); setModal({ type: null }); }} className="flex-1 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-medium text-white cursor-pointer shadow-sm shadow-red-900/40">Excluir</button>
                            <button onClick={() => setModal({ type: null })} className="flex-1 px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-medium text-white cursor-pointer">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: reabrir task */}
            {reopenModal.open && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setReopenModal({ open: false, taskId: null, nextStatus: null })}>
                    <div onClick={(e) => e.stopPropagation()} className="bg-slate-900/95 rounded-2xl p-4 sm:p-6 w-full max-w-md border border-slate-700/80 shadow-xl">
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div className="flex flex-col">
                                <span className="text-xs uppercase tracking-wide text-slate-400">Reabrir Task</span>
                                <h2 className="text-2xl font-semibold text-slate-100">Reabrir Task</h2>
                            </div>
                        </div>
                        <div className="h-px w-full bg-slate-700/70 mb-2" />
                        <p className="text-slate-200 text-sm mb-5">Tem certeza que deseja reabrir a Task ?</p>
                        <div className="flex gap-3 pt-3 justify-center">
                            <button type="button" onClick={() => setReopenModal({ open: false, taskId: null, nextStatus: null })} className="px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-medium text-white cursor-pointer min-w-[140px]">Cancelar</button>
                            <button type="button" onClick={async () => {
                                if (!reopenModal.taskId || !reopenModal.nextStatus) return;
                                await updateTask(reopenModal.taskId, { status: reopenModal.nextStatus });
                                setReopenModal({ open: false, taskId: null, nextStatus: null });
                            }} className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white cursor-pointer min-w-[140px]">Reabrir</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: concluir task */}
            {doneModal.open && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setDoneModal({ open: false, taskId: null, solution: "" })}>
                    <div onClick={(e) => e.stopPropagation()} className="bg-slate-900/95 rounded-2xl p-6 w-full max-w-lg border border-slate-700/80 shadow-xl">
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div className="flex flex-col">
                                <span className="text-xs uppercase tracking-wide text-slate-400">Concluir Task</span>
                                <h2 className="text-2xl font-semibold text-slate-100">Concluir Task</h2>
                            </div>
                        </div>
                        <div className="h-px w-full bg-slate-700/70 mb-2" />
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Solução/Conclusão:*</label>
                                <textarea value={doneModal.solution} onChange={(e) => setDoneModal({ ...doneModal, solution: e.target.value })} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" rows={4} required />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-3 justify-center">
                            <button type="button" onClick={() => setDoneModal({ open: false, taskId: null, solution: "" })} className="px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-medium text-white cursor-pointer min-w-[140px]">Cancelar</button>
                            <button type="button" onClick={async () => {
                                if (!doneModal.taskId) return;
                                if (!doneModal.solution.trim()) { toast.error("Informe a solução para concluir a task."); return; }
                                await updateTask(doneModal.taskId, { status: "DONE", solution: doneModal.solution.trim() });
                                setDoneModal({ open: false, taskId: null, solution: "" });
                            }} className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white cursor-pointer min-w-[140px]">Salvar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: ver solução */}
            {solutionModal.open && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSolutionModal({ open: false, taskId: null, solution: "" })}>
                    <div onClick={(e) => e.stopPropagation()} className="bg-slate-900/95 rounded-2xl p-6 w-full max-w-lg border border-slate-700/80 shadow-xl">
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div className="flex flex-col">
                                <span className="text-xs uppercase tracking-wide text-slate-400">Solução/Conclusão da Task</span>
                                <h2 className="text-2xl font-semibold text-slate-100">
                                    {(() => {
                                        const task = tasks.find((t) => t.id === solutionModal.taskId);
                                        return task?.title ? `Solução/Conclusão: ${task.title}` : "Solução da Task";
                                    })()}
                                </h2>
                            </div>
                            <button type="button" onClick={() => setSolutionModal({ open: false, taskId: null, solution: "" })} className="inline-flex items-center justify-center rounded-lg border border-slate-700/80 bg-slate-900/80 p-1.5 text-slate-200 hover:border-slate-500 hover:text-white transition-colors cursor-pointer" aria-label="Fechar modal">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="h-px w-full bg-slate-700/70 mb-2" />
                        <div className="space-y-3">
                            <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                                <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">{solutionModal.solution}</p>
                            </div>
                        </div>
                        <div className="pt-2" />
                    </div>
                </div>
            )}
        </>
    );
}

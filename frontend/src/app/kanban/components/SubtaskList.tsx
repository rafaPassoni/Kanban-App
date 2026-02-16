"use client";
import React from "react";
import { Plus, Pencil, Trash } from "lucide-react";
import type { Task } from "../types";
import { useSubtaskContext } from "../contexts/SubtaskContext";

interface SubtaskListProps {
    task: Task;
    perms: { canChange: boolean; canDelete: boolean };
}

export default function SubtaskList({ task, perms }: SubtaskListProps) {
    const {
        sortSubtasks, subtaskDrafts,
        editingSubtaskId, editingSubtaskTitle, editingSubtaskRef,
        draggedSubtask, dropTargetSubtaskId, dropTargetPosition,
        setEditingSubtaskId, setEditingSubtaskTitle,
        setDropTargetSubtaskId, setDropTargetPosition, setDraggedSubtask,
        updateSubtask, deleteSubtask, addSubtask,
        addSubtaskDraft, updateSubtaskDraft, removeSubtaskDraft,
        handleSubtaskDragStart, handleSubtaskDrop,
    } = useSubtaskContext();

    return (
        <div className="space-y-2 border-t border-slate-700/60 pt-2">
            <div className="flex items-center gap-1">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Subtarefas</p>
                {perms.canChange && (
                    <button
                        type="button"
                        onClick={() => { if (task.id) addSubtaskDraft(task.id); }}
                        className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 cursor-pointer"
                        title="Adicionar subtarefa"
                    >
                        <Plus className="h-3 w-3" />
                    </button>
                )}
            </div>
            {task.subtasks && task.subtasks.length > 0 && (
                <div
                    className="space-y-2"
                    onDragOver={(e) => {
                        if (!perms.canChange) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        setDropTargetSubtaskId(null);
                        setDropTargetPosition(null);
                    }}
                    onDrop={(e) => { if (task.id && perms.canChange) handleSubtaskDrop(e, task.id); }}
                >
                    {sortSubtasks(task.subtasks).map((subtask) => {
                        const isEditingThis = editingSubtaskId === subtask.id;
                        return (
                            <div
                                key={subtask.id}
                                data-subtask-dnd="true"
                                draggable={perms.canChange && !isEditingThis}
                                onDragStart={(e) => {
                                    if (!task.id || !subtask.id || isEditingThis) return;
                                    handleSubtaskDragStart(e, task.id, subtask.id);
                                }}
                                onDragOver={(e) => {
                                    if (!perms.canChange) return;
                                    e.stopPropagation();
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = "move";
                                    if (subtask.id) {
                                        setDropTargetSubtaskId(subtask.id);
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setDropTargetPosition(e.clientY > rect.top + rect.height / 2 ? "after" : "before");
                                    }
                                }}
                                onDragLeave={() => {
                                    if (dropTargetSubtaskId === subtask.id) {
                                        setDropTargetSubtaskId(null);
                                        setDropTargetPosition(null);
                                    }
                                }}
                                onDrop={(e) => {
                                    if (!task.id || !subtask.id || !perms.canChange) return;
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const isAfter = e.clientY > rect.top + rect.height / 2;
                                    handleSubtaskDrop(e, task.id, subtask.id, isAfter ? "after" : "before");
                                }}
                                onDragEnd={() => {
                                    setDraggedSubtask(null);
                                    setDropTargetSubtaskId(null);
                                    setDropTargetPosition(null);
                                }}
                                className={[
                                    "group/subtask flex items-center justify-between gap-2 text-xs text-slate-200 rounded-md border border-slate-700/60 bg-slate-900/40 px-2 py-1.5 transition-colors hover:border-blue-500/40 hover:bg-slate-900/70",
                                    isEditingThis ? "cursor-text" : perms.canChange ? "cursor-move" : "",
                                    draggedSubtask?.subtaskId === subtask.id ? "opacity-70" : "",
                                    dropTargetSubtaskId === subtask.id
                                        ? dropTargetPosition === "after"
                                            ? "border-blue-400/70 bg-blue-500/10 translate-y-[1px]"
                                            : "border-blue-400/70 bg-blue-500/10 -translate-y-[1px]"
                                        : "",
                                ].join(" ")}
                            >
                                <label className={`flex items-start gap-2 ${isEditingThis ? "cursor-text" : "cursor-pointer"}`}>
                                    <input
                                        type="checkbox"
                                        checked={subtask.is_done}
                                        disabled={isEditingThis}
                                        onChange={() => { if (subtask.id && !isEditingThis) updateSubtask(subtask.id, { is_done: !subtask.is_done }); }}
                                        className="mt-0.5 h-4 w-4 shrink-0 appearance-none rounded-full border border-slate-600 bg-slate-900 cursor-pointer transition-colors checked:border-blue-500 checked:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                    {isEditingThis ? (
                                        <span className={`flex-1 whitespace-pre-wrap break-words ${subtask.is_done ? "line-through text-slate-400" : "text-slate-100"}`}>
                                            <span aria-hidden>- </span>
                                            <span
                                                ref={editingSubtaskRef}
                                                contentEditable
                                                suppressContentEditableWarning
                                                onBlur={async () => {
                                                    if (!subtask.id) return;
                                                    const currentText = editingSubtaskRef.current?.textContent ?? editingSubtaskTitle;
                                                    const trimmed = currentText.trim();
                                                    if (trimmed) await updateSubtask(subtask.id, { title: trimmed });
                                                    setEditingSubtaskId(null);
                                                    setEditingSubtaskTitle("");
                                                }}
                                                onKeyDown={async (e) => {
                                                    if (e.key === "Escape") {
                                                        e.preventDefault();
                                                        setEditingSubtaskId(null);
                                                        setEditingSubtaskTitle("");
                                                        return;
                                                    }
                                                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                                        e.preventDefault();
                                                        if (!subtask.id) return;
                                                        const currentText = editingSubtaskRef.current?.textContent ?? editingSubtaskTitle;
                                                        const trimmed = currentText.trim();
                                                        if (trimmed) await updateSubtask(subtask.id, { title: trimmed });
                                                        setEditingSubtaskId(null);
                                                        setEditingSubtaskTitle("");
                                                    }
                                                }}
                                                className="outline-none cursor-text"
                                            >
                                                {editingSubtaskTitle}
                                            </span>
                                        </span>
                                    ) : (
                                        <span className={`whitespace-pre-wrap break-words ${subtask.is_done ? "line-through text-slate-400" : "text-slate-100"}`}>
                                            - {subtask.title}
                                        </span>
                                    )}
                                </label>
                                <div className="flex items-center opacity-0 transition-opacity group-hover/subtask:opacity-100 group-focus-within/subtask:opacity-100">
                                    {perms.canChange && subtask.id && (
                                        <button
                                            type="button"
                                            disabled={isEditingThis}
                                            onClick={() => {
                                                if (!subtask.id) return;
                                                setEditingSubtaskId(subtask.id);
                                                setEditingSubtaskTitle(subtask.title);
                                            }}
                                            className="rounded-md p-1 text-slate-300 hover:text-blue-300 hover:bg-blue-500/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Editar subtarefa"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                    {perms.canDelete && subtask.id && (
                                        <button
                                            type="button"
                                            disabled={isEditingThis}
                                            onClick={() => { if (subtask.id) deleteSubtask(subtask.id); }}
                                            className="rounded-md p-1 text-slate-300 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Excluir subtarefa"
                                        >
                                            <Trash className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {perms.canChange &&
                task.id &&
                (subtaskDrafts[task.id] || []).map((draft) => (
                    <div
                        key={draft.id}
                        className="flex items-center gap-2 text-xs text-slate-200 rounded-md border border-slate-700/60 bg-slate-900/40 px-2 py-1.5"
                    >
                        <span className="text-slate-500">-</span>
                        <input
                            type="text"
                            value={draft.title}
                            onChange={(e) => updateSubtaskDraft(task.id as number, draft.id, e.target.value)}
                            onBlur={async () => {
                                if (!task.id) return;
                                const didCreate = await addSubtask(task.id, draft.title);
                                if (didCreate || !draft.title.trim()) removeSubtaskDraft(task.id, draft.id);
                            }}
                            onKeyDown={async (e) => {
                                if (e.key !== "Enter") return;
                                e.preventDefault();
                                if (!task.id) return;
                                const didCreate = await addSubtask(task.id, draft.title);
                                if (didCreate || !draft.title.trim()) removeSubtaskDraft(task.id, draft.id);
                            }}
                            className="flex-1 bg-transparent outline-none text-slate-100 placeholder:text-slate-600"
                            placeholder="Nome da subtarefa..."
                            autoFocus
                        />
                    </div>
                ))}
        </div>
    );
}

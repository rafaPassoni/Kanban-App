"use client";
import React, { useCallback } from "react";
import { Calendar, User, Building2, Pencil, FileText, Trash, ChevronDown } from "lucide-react";
import { parseISODateLocal } from "@/app/components/DateInputBRNative";
import type { Task, Collaborator, Department } from "../types";
import { PRIORITY_COLORS, PRIORITY_LABELS } from "../constants";
import SubtaskList from "./SubtaskList";

interface TaskCardProps {
    task: Task;
    perms: { canChange: boolean; canDelete: boolean };
    collaborators: Collaborator[];
    departments: Department[];
    isExpanded: boolean;
    isDescriptionExpanded: boolean;
    onToggleExpanded: () => void;
    onToggleDescription: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onDragStart: (e: React.DragEvent) => void;
    onViewSolution: () => void;
}

export default function TaskCard({
    task, perms, collaborators, departments,
    isExpanded, isDescriptionExpanded, onToggleExpanded, onToggleDescription,
    onEdit, onDelete, onDragStart, onViewSolution,
}: TaskCardProps) {
    const subtaskCount = task.subtasks?.length ?? 0;
    const doneSubtasks = (task.subtasks || []).filter((s) => s.is_done).length;

    const isOverdue = useCallback((deadline?: string | null) => {
        if (!deadline) return false;
        const d = parseISODateLocal(deadline);
        if (!d || Number.isNaN(d.getTime())) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);
        return d < today;
    }, []);

    const assignedNames =
        task.assigned_to_names?.length
            ? task.assigned_to_names
            : (task.assigned_to || [])
                  .map((id) => collaborators.find((c) => c.id === id)?.name)
                  .filter(Boolean) as string[];

    const deptNames =
        task.department_names?.length
            ? task.department_names
            : (task.department || [])
                  .map((id) => departments.find((d) => d.id === id)?.name)
                  .filter(Boolean) as string[];

    return (
        <div className="pb-3">
            <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-700 rounded-xl overflow-hidden hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all group">
                {/* Header */}
                <div
                    draggable={perms.canChange}
                    onDragStart={onDragStart}
                    className="bg-slate-800/50 border-b border-slate-700/50 p-3 cursor-move"
                >
                    <div className="flex items-start justify-between gap-2 mb-0">
                        <div className="flex-1 min-w-0">
                            <span className="relative inline-block max-w-full align-middle group/title">
                                <h3
                                    className="font-semibold text-slate-50 text-base leading-tight mb-1 truncate cursor-text"
                                    draggable={false}
                                    onDragStart={(e) => e.preventDefault()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    {task.title}
                                </h3>
                                <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-max max-w-70 sm:max-w-80 opacity-0 transition-opacity duration-150 group-hover/title:opacity-100">
                                    <div className="rounded-lg border border-slate-700/80 bg-slate-950/95 px-3 py-2 text-xs text-slate-100 shadow-xl">
                                        {task.title}
                                    </div>
                                </div>
                            </span>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority].bg} ${PRIORITY_COLORS[task.priority].border} border ${PRIORITY_COLORS[task.priority].text} font-bold uppercase tracking-wide`}>
                                    {PRIORITY_LABELS[task.priority]}
                                </span>
                                {task.status === "DONE" && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide bg-emerald-600/20 text-emerald-300 border-emerald-600/40">
                                        Concluído
                                    </span>
                                )}
                                {subtaskCount > 0 && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-600/60 text-slate-300 uppercase tracking-wide">
                                        {doneSubtasks}/{subtaskCount}
                                    </span>
                                )}
                                {task.deadline && (
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        <span className="text-xs">
                                            {parseISODateLocal(task.deadline)?.toLocaleDateString("pt-BR")}
                                        </span>
                                        {task.status !== "DONE" && isOverdue(task.deadline) && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide bg-red-600/20 text-red-300 border-red-600/40">
                                                Atrasado
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {task.assigned_to_names && task.assigned_to_names.length > 0 && (
                                <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-200 bg-slate-900/30 px-2 py-1 rounded-md border border-slate-700/60 max-w-[220px]">
                                    <User className="h-3.5 w-3.5 text-blue-400" />
                                    <span className="truncate font-medium">{task.assigned_to_names.join(", ")}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                            {perms.canChange && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                                    className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-slate-300 hover:text-blue-300 cursor-pointer"
                                    title="Editar Task"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                            )}
                            {perms.canDelete && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                    className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 p-1 cursor-pointer"
                                >
                                    <Trash className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                    <div className="p-2 space-y-3">
                        {task.description && (
                            <div className="space-y-2">
                                <div className="flex justify-center">
                                    <button
                                        type="button"
                                        onClick={onToggleDescription}
                                        className="flex items-center justify-center gap-1 text-[11px] text-slate-300 hover:text-blue-300 cursor-pointer"
                                        title="Ver Descrição"
                                    >
                                        <span className="flex items-center gap-1 rounded-md bg-slate-800/70 border border-slate-700/60 px-2 py-1">
                                            <FileText className="h-3 w-3" />
                                            <span>{isDescriptionExpanded ? "Ocultar" : "Ver Descrição"}</span>
                                        </span>
                                    </button>
                                </div>
                                {isDescriptionExpanded && (
                                    <div className="bg-slate-800/30 rounded-lg p-2.5 border border-slate-700/50">
                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1.5">Descrição</p>
                                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{task.description}</p>
                                    </div>
                                )}
                                <div className="border-t border-slate-700/60" />
                            </div>
                        )}

                        {/* Responsáveis e Setores */}
                        <div className="space-y-2 -mt-1">
                            {assignedNames.length > 0 && (
                                <div className="flex items-center gap-2 bg-gradient-to-r from-blue-900/20 to-transparent px-3 py-2 rounded-lg border border-blue-700/30">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-900/50 border border-blue-600/50">
                                        <User className="h-4 w-4 text-blue-300" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wide">Responsáveis</p>
                                        <p className="text-sm text-slate-200 font-medium truncate">{assignedNames.join(", ")}</p>
                                    </div>
                                </div>
                            )}
                            {deptNames.length > 0 && (
                                <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-900/20 to-transparent px-3 py-2 rounded-lg border border-emerald-700/30">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-900/50 border border-emerald-600/50">
                                        <Building2 className="h-4 w-4 text-emerald-300" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wide">Setores</p>
                                        <p className="text-sm text-slate-200 font-medium truncate">{deptNames.join(", ")}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <SubtaskList task={task} perms={perms} />

                        {perms.canChange && task.status === "DONE" && task.solution && (
                            <div className="flex justify-center gap-2 -mt-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onViewSolution(); }}
                                    className="py-2 px-3 text-xs font-medium bg-emerald-700/30 hover:bg-emerald-700/50 border border-emerald-600/60 hover:border-emerald-500 rounded-lg transition-all text-emerald-200 hover:text-emerald-100 cursor-pointer"
                                >
                                    Ver Solução
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Expand/collapse button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleExpanded(); }}
                    className="w-full py-1 text-xs font-medium bg-slate-800/30 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 rounded-b-lg transition-all text-slate-300 hover:text-slate-200 flex items-center justify-center gap-1 cursor-pointer"
                >
                    <ChevronDown className={`h-3 w-3 ${isExpanded ? "rotate-180" : ""}`} />
                </button>
            </div>
        </div>
    );
}

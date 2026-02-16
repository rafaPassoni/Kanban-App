"use client";
import { createContext, useContext } from "react";
import type { Subtask } from "../types";

export interface SubtaskContextType {
    sortSubtasks: (subtasks: Subtask[]) => Subtask[];
    subtaskDrafts: Record<number, { id: string; title: string }[]>;
    editingSubtaskId: number | null;
    editingSubtaskTitle: string;
    editingSubtaskRef: React.RefObject<HTMLSpanElement | null>;
    draggedSubtask: { taskId: number; subtaskId: number } | null;
    dropTargetSubtaskId: number | null;
    dropTargetPosition: "before" | "after" | null;
    setEditingSubtaskId: (id: number | null) => void;
    setEditingSubtaskTitle: (title: string) => void;
    setDropTargetSubtaskId: (id: number | null) => void;
    setDropTargetPosition: (pos: "before" | "after" | null) => void;
    setDraggedSubtask: (val: { taskId: number; subtaskId: number } | null) => void;
    updateSubtask: (id: number, payload: Partial<Subtask>) => Promise<void>;
    deleteSubtask: (id: number) => Promise<void>;
    addSubtask: (taskId: number, title: string) => Promise<boolean>;
    addSubtaskDraft: (taskId: number) => void;
    updateSubtaskDraft: (taskId: number, draftId: string, title: string) => void;
    removeSubtaskDraft: (taskId: number, draftId: string) => void;
    handleSubtaskDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: number, subtaskId: number) => void;
    handleSubtaskDrop: (e: React.DragEvent<HTMLDivElement>, taskId: number, targetSubtaskId?: number, targetPosition?: "before" | "after" | null) => void;
}

const SubtaskContext = createContext<SubtaskContextType | null>(null);

export function SubtaskProvider({ value, children }: { value: SubtaskContextType; children: React.ReactNode }) {
    return <SubtaskContext.Provider value={value}>{children}</SubtaskContext.Provider>;
}

export function useSubtaskContext(): SubtaskContextType {
    const ctx = useContext(SubtaskContext);
    if (!ctx) throw new Error("useSubtaskContext must be used within SubtaskProvider");
    return ctx;
}

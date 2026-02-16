import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { API_SUBTASKS } from "@/constants/api";
import type { Task, Subtask } from "../types";

export function useSubtasks(
    tasks: Task[],
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
    authedFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>,
) {
    const [subtaskDrafts, setSubtaskDrafts] = useState<Record<number, { id: string; title: string }[]>>({});
    const [editingSubtaskId, setEditingSubtaskId] = useState<number | null>(null);
    const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");
    const editingSubtaskRef = useRef<HTMLSpanElement | null>(null);
    const [draggedSubtask, setDraggedSubtask] = useState<{ taskId: number; subtaskId: number } | null>(null);
    const [dropTargetSubtaskId, setDropTargetSubtaskId] = useState<number | null>(null);
    const [dropTargetPosition, setDropTargetPosition] = useState<"before" | "after" | null>(null);

    useEffect(() => {
        if (!editingSubtaskId || !editingSubtaskRef.current) return;
        const el = editingSubtaskRef.current;
        el.focus();
        const selection = window.getSelection();
        if (!selection) return;
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }, [editingSubtaskId]);

    const updateSubtask = useCallback(
        async (id: number, payload: Partial<Subtask>) => {
            try {
                const res = await authedFetch(`${API_SUBTASKS}/${id}/`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    toast.error("Erro ao atualizar subtarefa.");
                    return;
                }
                const updated = await res.json();
                setTasks((prev) =>
                    prev.map((t) =>
                        t.id === updated.task
                            ? {
                                  ...t,
                                  subtasks: (t.subtasks || []).map((s) => (s.id === updated.id ? updated : s)),
                              }
                            : t,
                    ),
                );
            } catch (e) {
                console.error(e);
                toast.error("Erro ao atualizar subtarefa.");
            }
        },
        [authedFetch, setTasks],
    );

    const addSubtask = useCallback(
        async (taskId: number, title: string) => {
            const trimmed = title.trim();
            if (!trimmed) return false;
            if (!Number.isFinite(taskId) || taskId <= 0) {
                toast.error("Tarefa inválida para criar subtarefa.");
                return false;
            }
            const task = tasks.find((t) => t.id === taskId);
            if (!task) {
                toast.error("A tarefa nao foi encontrada.");
                return false;
            }
            try {
                const res = await authedFetch(`${API_SUBTASKS}/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ task: taskId, title: trimmed }),
                });
                if (!res.ok) {
                    let message = "Erro ao criar subtarefa.";
                    try {
                        const data = await res.json();
                        if (data?.detail) message = String(data.detail);
                        else if (data?.task?.[0]) message = String(data.task[0]);
                        else if (data?.title?.[0]) message = String(data.title[0]);
                    } catch { /* ignora parse error */ }
                    toast.error(message);
                    return false;
                }
                const created = await res.json();
                setTasks((prev) =>
                    prev.map((t) =>
                        t.id === taskId
                            ? { ...t, subtasks: [...(t.subtasks || []), created] }
                            : t,
                    ),
                );
                return true;
            } catch (e) {
                console.error(e);
                toast.error("Erro ao criar subtarefa.");
                return false;
            }
        },
        [authedFetch, tasks, setTasks],
    );

    const addSubtaskDraft = useCallback((taskId: number) => {
        const draftId = `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        setSubtaskDrafts((prev) => ({
            ...prev,
            [taskId]: [...(prev[taskId] || []), { id: draftId, title: "" }],
        }));
    }, []);

    const updateSubtaskDraft = useCallback((taskId: number, draftId: string, title: string) => {
        setSubtaskDrafts((prev) => ({
            ...prev,
            [taskId]: (prev[taskId] || []).map((draft) =>
                draft.id === draftId ? { ...draft, title } : draft,
            ),
        }));
    }, []);

    const removeSubtaskDraft = useCallback((taskId: number, draftId: string) => {
        setSubtaskDrafts((prev) => ({
            ...prev,
            [taskId]: (prev[taskId] || []).filter((draft) => draft.id !== draftId),
        }));
    }, []);

    const deleteSubtask = useCallback(
        async (id: number) => {
            try {
                const res = await authedFetch(`${API_SUBTASKS}/${id}/`, { method: "DELETE" });
                if (res.ok || res.status === 204) {
                    setTasks((prev) =>
                        prev.map((t) => ({
                            ...t,
                            subtasks: (t.subtasks || []).filter((s) => s.id !== id),
                        })),
                    );
                    toast.success("Subtarefa excluida com sucesso!");
                    return;
                }
                toast.error("Erro ao excluir subtarefa.");
            } catch (e) {
                console.error(e);
                toast.error("Erro ao excluir subtarefa.");
            }
        },
        [authedFetch, setTasks],
    );

    const sortSubtasks = useCallback((subtasks: Subtask[]) => {
        return [...subtasks].sort((a, b) => {
            const aIndex = subtasks.indexOf(a);
            const bIndex = subtasks.indexOf(b);
            const aOrder = typeof a.order === "number" ? a.order : 10_000 + aIndex;
            const bOrder = typeof b.order === "number" ? b.order : 10_000 + bIndex;
            if (aOrder !== bOrder) return aOrder - bOrder;
            return aIndex - bIndex;
        });
    }, []);

    const handleSubtaskDragStart = useCallback(
        (e: React.DragEvent<HTMLDivElement>, taskId: number, subtaskId: number) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("application/json", JSON.stringify({ taskId, subtaskId }));
            e.dataTransfer.setData("text/plain", String(subtaskId));
            setDraggedSubtask({ taskId, subtaskId });
        },
        [],
    );

    const handleSubtaskDrop = useCallback(
        async (
            e: React.DragEvent<HTMLDivElement>,
            taskId: number,
            targetSubtaskId?: number,
            targetPosition?: "before" | "after" | null,
        ) => {
            e.preventDefault();
            let sourceTaskId = draggedSubtask?.taskId;
            let sourceSubtaskId = draggedSubtask?.subtaskId;
            const raw = e.dataTransfer.getData("application/json");
            if (raw) {
                try {
                    const parsed = JSON.parse(raw) as { taskId?: number; subtaskId?: number };
                    if (parsed.taskId && parsed.subtaskId) {
                        sourceTaskId = parsed.taskId;
                        sourceSubtaskId = parsed.subtaskId;
                    }
                } catch { /* usa estado local */ }
            }
            if (!sourceSubtaskId) {
                const plain = e.dataTransfer.getData("text/plain");
                const parsedId = Number(plain);
                if (!Number.isNaN(parsedId)) {
                    sourceSubtaskId = parsedId;
                }
            }
            if (!sourceTaskId) sourceTaskId = taskId;
            if (!sourceTaskId || !sourceSubtaskId || sourceTaskId !== taskId) {
                setDraggedSubtask(null);
                return;
            }
            if (targetSubtaskId && sourceSubtaskId === targetSubtaskId) {
                setDraggedSubtask(null);
                return;
            }
            const task = tasks.find((t) => t.id === taskId);
            if (!task || !task.subtasks || task.subtasks.length === 0) {
                setDraggedSubtask(null);
                return;
            }
            const sorted = sortSubtasks(task.subtasks);
            const fromIndex = sorted.findIndex((s) => s.id === sourceSubtaskId);
            if (fromIndex < 0) {
                setDraggedSubtask(null);
                return;
            }
            let toIndex =
                targetSubtaskId && sorted.some((s) => s.id === targetSubtaskId)
                    ? sorted.findIndex((s) => s.id === targetSubtaskId)
                    : sorted.length;
            if (toIndex < 0) {
                setDraggedSubtask(null);
                return;
            }
            if (targetSubtaskId && targetPosition === "after") {
                toIndex += 1;
            }
            const next = [...sorted];
            const [moved] = next.splice(fromIndex, 1);
            if (fromIndex < toIndex) toIndex -= 1;
            next.splice(toIndex, 0, moved);
            const withOrder = next.map((s, index) => ({ ...s, order: index }));
            const previousOrderMap = new Map(sorted.map((s, index) => [s.id, s.order ?? index]));
            const changed = withOrder.filter((s) => s.id && previousOrderMap.get(s.id) !== s.order);
            setTasks((prev) =>
                prev.map((t) => (t.id === taskId ? { ...t, subtasks: withOrder } : t)),
            );
            if (changed.length > 0) {
                await Promise.all(
                    changed.map((s) => (s.id ? updateSubtask(s.id, { order: s.order }) : Promise.resolve())),
                );
            }
            setDraggedSubtask(null);
            setDropTargetSubtaskId(null);
            setDropTargetPosition(null);
        },
        [draggedSubtask, tasks, sortSubtasks, updateSubtask, setTasks],
    );

    return {
        subtaskDrafts,
        editingSubtaskId, setEditingSubtaskId,
        editingSubtaskTitle, setEditingSubtaskTitle,
        editingSubtaskRef,
        draggedSubtask, setDraggedSubtask,
        dropTargetSubtaskId, setDropTargetSubtaskId,
        dropTargetPosition, setDropTargetPosition,
        updateSubtask, addSubtask, deleteSubtask,
        addSubtaskDraft, updateSubtaskDraft, removeSubtaskDraft,
        sortSubtasks,
        handleSubtaskDragStart, handleSubtaskDrop,
    };
}

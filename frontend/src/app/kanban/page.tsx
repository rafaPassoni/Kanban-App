"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "@/app/components/Navbar";
import AuthService from "@/services/auth";
import AccessService from "@/services/access";
import { API_TASKS, API_PROJECTS, API_COLLABORATORS, API_DEPARTMENTS, API_SUBTASKS } from "@/constants/api";
import {
    Plus,
    Calendar,
    User,
    Building2,
    AlertCircle,
    CheckCircle2,
    Clock,
    Pencil,
    FileText,
    Trash,
    X,
    Tv,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { KanbanFill } from "react-bootstrap-icons";
import DateInputBRNative, { isoToBR, brToISO, parseISODateLocal } from "@/app/components/DateInputBRNative";

// ====================
// Tipos
// ====================
interface Task {
    id?: number;
    title: string;
    description?: string;
    solution?: string | null;
    status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    project?: number | null;
    project_name?: string;
    responsavel?: number | null;
    responsavel_name?: string;
    assigned_to?: number[];
    assigned_to_names?: string[];
    department?: number[];
    department_names?: string[];
    order: number;
    start_date?: string | null;
    deadline?: string | null;
    completed_at?: string | null;
    created_at?: string;
    updated_at?: string;
    subtasks?: Subtask[];
}
interface Subtask {
    id?: number;
    task: number;
    title: string;
    is_done: boolean;
    order?: number;
    created_at?: string;
}
interface Project {
    id: number;
    name: string;
}
interface Collaborator {
    id: number;
    name: string;
}
interface Department {
    id: number;
    name: string;
}
type Modal =
    | { type: null }
    | { type: "add" }
    | { type: "edit"; id: number }
    | { type: "delete"; id: number; title?: string };

// ====================
// Constantes
// ====================
const COLUMNS = [
    { id: "TODO", title: "A FAZER", icon: AlertCircle, color: "slate" },
    { id: "IN_PROGRESS", title: "EM PROGRESSO", icon: Clock, color: "blue" },
    { id: "IN_REVIEW", title: "EM REVISÃO", icon: FileText, color: "yellow" },
    { id: "DONE", title: "CONCLUÍDO", icon: CheckCircle2, color: "emerald" },
] as const;
const PRIORITY_COLORS = {
    LOW: { bg: "bg-slate-600/20", border: "border-slate-600/40", text: "text-slate-300" },
    MEDIUM: { bg: "bg-blue-600/20", border: "border-blue-600/40", text: "text-blue-300" },
    HIGH: { bg: "bg-orange-600/20", border: "border-orange-600/40", text: "text-orange-300" },
    URGENT: { bg: "bg-red-600/20", border: "border-red-600/40", text: "text-red-300" },
};
const PRIORITY_LABELS = {
    LOW: "Baixa",
    MEDIUM: "Média",
    HIGH: "Alta",
    URGENT: "Urgente",
};
const TASK_REFRESH_INTERVAL = 5_000;

const EMPTY_FORM: Omit<Task, "id" | "created_at" | "updated_at"> = {
    title: "",
    description: "",
    solution: "",
    status: "TODO",
    priority: "MEDIUM",
    project: null,
    responsavel: null,
    assigned_to: [],
    department: [],
    order: 0,
    start_date: null,
    deadline: null,
};

type ColumnTaskListProps = {
    tasks: Task[];
    renderTask: (task: Task, index: number) => React.ReactNode;
};
function ColumnTaskList({ tasks, renderTask }: ColumnTaskListProps) {
    return (
        <div className="flex-1 min-h-[200px] overflow-y-auto">
            <div className="-space-y-2">
                {tasks.map((task, index) => (
                    <div key={task?.id ?? `task-${index}`}>
                        {renderTask(task, index)}
                    </div>
                ))}
            </div>
        </div>
    );
}
// ====================
// Pagina
// ====================
export default function KanbanPage() {
    // -------- Dados
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    // -------- Interface
    const [modal, setModal] = useState<Modal>({ type: null });
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
    const [descriptionTasks, setDescriptionTasks] = useState<Set<number>>(new Set());
    const [draggedSubtask, setDraggedSubtask] = useState<{ taskId: number; subtaskId: number } | null>(null);
    const [dropTargetSubtaskId, setDropTargetSubtaskId] = useState<number | null>(null);
    const [dropTargetPosition, setDropTargetPosition] = useState<"before" | "after" | null>(null);
    const [subtaskDrafts, setSubtaskDrafts] = useState<Record<number, { id: string; title: string }[]>>({});
    const [editingSubtaskId, setEditingSubtaskId] = useState<number | null>(null);
    const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");
    const editingSubtaskRef = useRef<HTMLSpanElement | null>(null);
    const [collapsedColumns, setCollapsedColumns] = useState<Set<Task["status"]>>(new Set());
    const [reopenModal, setReopenModal] = useState<{
        open: boolean;
        taskId: number | null;
        nextStatus: Task["status"] | null;
    }>({ open: false, taskId: null, nextStatus: null });
    const [doneModal, setDoneModal] = useState<{
        open: boolean;
        taskId: number | null;
        solution: string;
    }>({ open: false, taskId: null, solution: "" });
    const [solutionModal, setSolutionModal] = useState<{
        open: boolean;
        taskId: number | null;
        solution: string;
    }>({ open: false, taskId: null, solution: "" });
    // -------- Filtros
    const [filterProject, setFilterProject] = useState<string>("all");
    const [filterAssignedTo, setFilterAssignedTo] = useState<string>("all");
    const [filterDepartment, setFilterDepartment] = useState<string>("all");
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
    const [isAssignedDropdownOpen, setIsAssignedDropdownOpen] = useState(false);
    const [isDepartmentDropdownOpen, setIsDepartmentDropdownOpen] = useState(false);
    const [isAddProjectDropdownOpen, setIsAddProjectDropdownOpen] = useState(false);
    const [isAddPriorityDropdownOpen, setIsAddPriorityDropdownOpen] = useState(false);
    const [isEditStatusDropdownOpen, setIsEditStatusDropdownOpen] = useState(false);
    const [isEditPriorityDropdownOpen, setIsEditPriorityDropdownOpen] = useState(false);
    const [isEditProjectDropdownOpen, setIsEditProjectDropdownOpen] = useState(false);
    const [, setProjectTypeahead] = useState("");
    const [, setAssignedTypeahead] = useState("");
    const [, setDepartmentTypeahead] = useState("");
    // -------- Formulario
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [editForm, setEditForm] = useState(EMPTY_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const projectDropdownRef = useRef<HTMLDivElement | null>(null);
    const assignedDropdownRef = useRef<HTMLDivElement | null>(null);
    const departmentDropdownRef = useRef<HTMLDivElement | null>(null);
    const projectListRef = useRef<HTMLUListElement | null>(null);
    const assignedListRef = useRef<HTMLUListElement | null>(null);
    const departmentListRef = useRef<HTMLUListElement | null>(null);
    const projectTypeaheadTimer = useRef<number | null>(null);
    const assignedTypeaheadTimer = useRef<number | null>(null);
    const departmentTypeaheadTimer = useRef<number | null>(null);
    const addProjectDropdownRef = useRef<HTMLDivElement | null>(null);
    const addPriorityDropdownRef = useRef<HTMLDivElement | null>(null);
    const editStatusDropdownRef = useRef<HTMLDivElement | null>(null);
    const editPriorityDropdownRef = useRef<HTMLDivElement | null>(null);
    const editProjectDropdownRef = useRef<HTMLDivElement | null>(null);
    // -------- Permissoes
    const [perms, setPerms] = useState({
        canAdd: false,
        canChange: false,
        canDelete: false,
    });
    // ====================
    // Auxiliar de fetch autenticado
    // ====================
    const authedFetch = useCallback((input: RequestInfo, init: RequestInit = {}) => {
        // Centraliza autenticacao e renovacao de token nas chamadas.
        return AuthService.fetchWithAuth(input, init);
    }, []);
    // ====================
    // Carregadores
    // ====================
    const loadPermissions = useCallback(async () => {
        const p = await AccessService.getUserPermissions();
        setPerms({
            canAdd: AccessService.has(p, "add", "task"),
            canChange: AccessService.has(p, "change", "task"),
            canDelete: AccessService.has(p, "delete", "task"),
        });
    }, []);
    const fetchData = useCallback(async (options?: { silent?: boolean }) => {
        try {
            // Modo silencioso evita piscar tela em refreshes pontuais.
            if (!options?.silent) {
                setLoading(true);
            }
            const [tasksRes, projectsRes, collabRes, deptRes] = await Promise.all([
                authedFetch(`${API_TASKS}/`),
                authedFetch(`${API_PROJECTS}/`),
                authedFetch(`${API_COLLABORATORS}/`),
                authedFetch(`${API_DEPARTMENTS}/`)
            ]);
            if (!tasksRes.ok) throw new Error(`Erro ao buscar tasks: ${tasksRes.status}`);
            const tasksData = await tasksRes.json();
            const projectsData = projectsRes.ok ? await projectsRes.json() : [];
            const collabData = collabRes.ok ? await collabRes.json() : [];
            const deptData = deptRes.ok ? await deptRes.json() : [];
            setTasks(Array.isArray(tasksData) ? tasksData : []);
            setProjects(Array.isArray(projectsData) ? projectsData : []);
            setCollaborators(Array.isArray(collabData) ? collabData : []);
            setDepartments(Array.isArray(deptData) ? deptData : []);
        } catch (e) {
            console.error(e);
            if (!options?.silent) {
                setTasks([]);
                toast.error("Erro ao carregar dados.");
            }
        } finally {
            if (!options?.silent) {
                setLoading(false);
            }
        }
    }, [authedFetch]);
    useEffect(() => {
        // Inicializa tarefas, filtros auxiliares e permissoes da tela.
        fetchData();
        loadPermissions();
    }, [fetchData, loadPermissions]);

    useEffect(() => {
        // Fecha dropdowns ao clicar fora para manter o estado da UI consistente.
        const handleClickOutside = (event: MouseEvent) => {
            if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
                setIsProjectDropdownOpen(false);
            }
            if (assignedDropdownRef.current && !assignedDropdownRef.current.contains(event.target as Node)) {
                setIsAssignedDropdownOpen(false);
            }
            if (departmentDropdownRef.current && !departmentDropdownRef.current.contains(event.target as Node)) {
                setIsDepartmentDropdownOpen(false);
            }
            if (addProjectDropdownRef.current && !addProjectDropdownRef.current.contains(event.target as Node)) {
                setIsAddProjectDropdownOpen(false);
            }
            if (addPriorityDropdownRef.current && !addPriorityDropdownRef.current.contains(event.target as Node)) {
                setIsAddPriorityDropdownOpen(false);
            }
            if (editStatusDropdownRef.current && !editStatusDropdownRef.current.contains(event.target as Node)) {
                setIsEditStatusDropdownOpen(false);
            }
            if (editPriorityDropdownRef.current && !editPriorityDropdownRef.current.contains(event.target as Node)) {
                setIsEditPriorityDropdownOpen(false);
            }
            if (editProjectDropdownRef.current && !editProjectDropdownRef.current.contains(event.target as Node)) {
                setIsEditProjectDropdownOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            setIsProjectDropdownOpen(false);
            setIsAssignedDropdownOpen(false);
            setIsDepartmentDropdownOpen(false);
            setIsAddProjectDropdownOpen(false);
            setIsAddPriorityDropdownOpen(false);
            setIsEditStatusDropdownOpen(false);
            setIsEditPriorityDropdownOpen(false);
            setIsEditProjectDropdownOpen(false);
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    useEffect(() => {
        if (!isProjectDropdownOpen) {
            setProjectTypeahead("");
            return;
        }
        const handle = setTimeout(() => projectDropdownRef.current?.focus(), 0);
        return () => clearTimeout(handle);
    }, [isProjectDropdownOpen]);

    useEffect(() => {
        if (!isAssignedDropdownOpen) {
            setAssignedTypeahead("");
            return;
        }
        const handle = setTimeout(() => assignedDropdownRef.current?.focus(), 0);
        return () => clearTimeout(handle);
    }, [isAssignedDropdownOpen]);

    useEffect(() => {
        if (!isDepartmentDropdownOpen) {
            setDepartmentTypeahead("");
            return;
        }
        const handle = setTimeout(() => departmentDropdownRef.current?.focus(), 0);
        return () => clearTimeout(handle);
    }, [isDepartmentDropdownOpen]);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            fetchData({ silent: true });
        }, TASK_REFRESH_INTERVAL);
        return () => window.clearInterval(intervalId);
    }, [fetchData]);

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
    // ====================
    // Acoes
    // ====================
    const toggleTaskExpanded = useCallback((taskId: number) => {
        setExpandedTasks((prev) => {
            const next = new Set(prev);
            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }
            return next;
        });
    }, []);
    const toggleTaskDescription = useCallback((taskId: number) => {
        setDescriptionTasks((prev) => {
            const next = new Set(prev);
            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }
            return next;
        });
    }, []);
    const toggleColumnCollapsed = useCallback((status: Task["status"]) => {
        setCollapsedColumns((prev) => {
            const next = new Set(prev);
            if (next.has(status)) {
                next.delete(status);
            } else {
                next.add(status);
            }
            return next;
        });
    }, []);

    const handleTypeaheadSelect = useCallback(
        (
            event: React.KeyboardEvent,
            options: { value: string; label: string }[],
            setBuffer: React.Dispatch<React.SetStateAction<string>>,
            setFilter: (value: string) => void,
            timerRef: React.MutableRefObject<number | null>,
            listRef: React.RefObject<HTMLUListElement | null>,
        ) => {
            if (event.key === "Escape") return;
            if (event.key === "Enter" || event.key === "ArrowDown" || event.key === "ArrowUp") return;
            if (event.key.length !== 1) return;

            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
            }

            setBuffer((prev) => {
                const next = (prev + event.key).toLowerCase();
                const match = options.find((opt) => opt.label.toLowerCase().startsWith(next));
                if (match) {
                    setFilter(match.value);
                    const el = listRef.current?.querySelector<HTMLButtonElement>(
                        `[data-option-value="${match.value}"]`,
                    );
                    el?.scrollIntoView({ block: "nearest" });
                    event.preventDefault();
                }
                timerRef.current = window.setTimeout(() => setBuffer(""), 700);
                return next;
            });
        },
        [],
    );
    const addTask = useCallback(
        async (payload: Omit<Task, "id" | "created_at" | "updated_at">) => {
            try {
                setIsSubmitting(true);
                const res = await authedFetch(`${API_TASKS}/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    toast.error("Erro ao criar task.");
                    return;
                }
                const created = await res.json();
                setTasks((prev) => [...prev, created]);
                setFormData(EMPTY_FORM);
                setModal({ type: null });
                toast.success("Task criada com sucesso!");
            } catch (e) {
                console.error(e);
                toast.error("Erro ao criar task.");
            } finally {
                setIsSubmitting(false);
            }
        },
        [authedFetch],
    );
    const updateTask = useCallback(
        async (id: number, payload: Partial<Task>) => {
            try {
                const res = await authedFetch(`${API_TASKS}/${id}/`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    toast.error("Erro ao atualizar task.");
                    return;
                }
                const updated = await res.json();
                setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
            } catch (e) {
                console.error(e);
                toast.error("Erro ao atualizar task.");
            }
        },
        [authedFetch],
    );
    const deleteTask = useCallback(
        async (id: number) => {
            try {
                const res = await authedFetch(`${API_TASKS}/${id}/`, { method: "DELETE" });
                if (res.ok || res.status === 204) {
                    setTasks((prev) => prev.filter((t) => t.id !== id));
                    toast.success("Task excluída com sucesso!");
                    return;
                }
                toast.error("Erro ao excluir task.");
            } catch (e) {
                console.error(e);
                toast.error("Erro ao excluir task.");
            }
        },
        [authedFetch],
    );
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
        [authedFetch],
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
                toast.error("A tarefa não foi encontrada.");
                return false;
            }
            try {
                const res = await authedFetch(`${API_SUBTASKS}/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        task: taskId,
                        title: trimmed,
                    }),
                });
                if (!res.ok) {
                    let message = "Erro ao criar subtarefa.";
                    try {
                        const data = await res.json();
                        if (data?.detail) message = String(data.detail);
                        else if (data?.task?.[0]) message = String(data.task[0]);
                        else if (data?.title?.[0]) message = String(data.title[0]);
                    } catch {}
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
        [authedFetch, tasks],
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
                const res = await authedFetch(`${API_SUBTASKS}/${id}/`, {
                    method: "DELETE",
                });
                if (res.ok || res.status === 204) {
                    setTasks((prev) =>
                        prev.map((t) => ({
                            ...t,
                            subtasks: (t.subtasks || []).filter((s) => s.id !== id),
                        })),
                    );
                    toast.success("Subtarefa excluída com sucesso!");
                    return;
                }
                toast.error("Erro ao excluir subtarefa.");
            } catch (e) {
                console.error(e);
                toast.error("Erro ao excluir subtarefa.");
            }
        },
        [authedFetch],
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
    
    // ====================
    // Arrastar e soltar
    // ====================
    const handleDragStart = (e: React.DragEvent, task: Task) => {
        if (!perms.canChange) return;
        e.dataTransfer.effectAllowed = "move";
        setDraggedTask(task);
    };
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };
    const handleDrop = async (newStatus: Task["status"]) => {
        if (!draggedTask || !draggedTask.id) return;
        if (draggedTask.status !== newStatus) {
            if (draggedTask.status === "DONE" && newStatus !== "DONE") {
                setReopenModal({ open: true, taskId: draggedTask.id, nextStatus: newStatus });
                setDraggedTask(null);
                return;
            }
            if (newStatus === "DONE") {
                setDoneModal({
                    open: true,
                    taskId: draggedTask.id,
                    solution: draggedTask.solution?.trim() || "",
                });
                setDraggedTask(null);
                return;
            }
            await updateTask(draggedTask.id, { status: newStatus });
        }
        setDraggedTask(null);
    };
    const handleSubtaskDragStart = (
        e: React.DragEvent<HTMLDivElement>,
        taskId: number,
        subtaskId: number,
    ) => {
        if (!perms.canChange) return;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("application/json", JSON.stringify({ taskId, subtaskId }));
        e.dataTransfer.setData("text/plain", String(subtaskId));
        setDraggedSubtask({ taskId, subtaskId });
    };
    const handleSubtaskDrop = async (
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
            } catch {
                // usa o estado local como alternativa
            }
        }
        if (!sourceSubtaskId) {
            const plain = e.dataTransfer.getData("text/plain");
            const parsedId = Number(plain);
            if (!Number.isNaN(parsedId)) {
                sourceSubtaskId = parsedId;
            }
        }
        if (!sourceTaskId) {
            sourceTaskId = taskId;
        }
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
    };

    // ====================
    // Filtros
    // ====================
    const filteredTasks = tasks.filter((task) => {
        const matchProject = filterProject === "all" || task.project === Number(filterProject);
        const matchAssigned =
            filterAssignedTo === "all" || (task.assigned_to || []).includes(Number(filterAssignedTo));
        const matchDept =
            filterDepartment === "all" || (task.department || []).includes(Number(filterDepartment));
        return matchProject && matchAssigned && matchDept;
    });
    const getTasksByStatus = (status: Task["status"]) => {
        const priorityRank: Record<Task["priority"], number> = {
            URGENT: 0,
            HIGH: 1,
            MEDIUM: 2,
            LOW: 3,
        };
        const toDate = (value?: string | null) => {
            return parseISODateLocal(value);
        };
        const getDoneDate = (task: Task) => {
            return (
                toDate(task.completed_at) ||
                toDate(task.updated_at) ||
                toDate(task.created_at) ||
                null
            );
        };
        const isLate = (value?: string | null) => {
            const d = toDate(value);
            if (!d) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            d.setHours(0, 0, 0, 0);
            return d < today;
        };
        return filteredTasks
            .filter((t) => t.status === status)
            .sort((a, b) => {
                if (status === "DONE") {
                    const da = getDoneDate(a);
                    const db = getDoneDate(b);
                    if (da && db) return db.getTime() - da.getTime();
                    if (da) return -1;
                    if (db) return 1;
                    return (a.order ?? 0) - (b.order ?? 0);
                }
                const prio = priorityRank[a.priority] - priorityRank[b.priority];
                if (prio !== 0) return prio;
                const overdue = Number(isLate(b.deadline)) - Number(isLate(a.deadline));
                if (overdue !== 0) return overdue;
                const da = toDate(a.deadline);
            const db = toDate(b.deadline);
            if (da && db) return da.getTime() - db.getTime();
            if (da) return -1;
            if (db) return 1;
            return (a.order ?? 0) - (b.order ?? 0);
        });
    };

    // ====================
    // Manipuladores
    // ====================
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    const handleSubmitAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title) {
            toast.error("Nome é obrigatório!");
            return;
        }
        addTask(formData);
    };
    const startEdit = (task: Task) => {
        if (!task.id) return;
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
        setModal({ type: "edit", id: task.id });
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
    const isOverdue = useCallback((deadline?: string | null) => {
        if (!deadline) return false;
        const d = parseISODateLocal(deadline);
        if (!d) return false;
        if (Number.isNaN(d.getTime())) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);
        return d < today;
    }, []);

    // ====================
    // Carregando
    // ====================
    if (loading) {
        return (
            <>
                <Navbar />
                <ToastContainer position="bottom-right" />
                <div className="min-h-[calc(100vh-120px)] overflow-hidden text-slate-100 px-4 pb-4 pt-0">
                    <div className="w-full max-w-8xl mx-auto">
                        <div className="-mt-5 flex flex-wrap gap-4">
                            {COLUMNS.map((column) => (
                                <div
                                    key={column.id}
                                    className="bg-slate-800/50 rounded-xl border border-slate-700/50 flex flex-col h-[calc(100vh-170px)] flex-1 min-w-[280px] pt-2 px-4 pb-4"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 w-full">
                                            <div className="h-5 w-5 rounded-full bg-slate-700/70 animate-pulse" />
                                            <div className="h-4 w-32 rounded bg-slate-700/70 animate-pulse" />
                                            <div className="ml-auto h-4 w-8 rounded-full bg-slate-700/70 animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                                        {Array.from({ length: 4 }).map((_, index) => (
                                            <div
                                                key={`${column.id}-skeleton-${index}`}
                                                className="bg-slate-900/70 border border-slate-700 rounded-xl p-3 space-y-2"
                                            >
                                                <div className="h-4 w-3/4 rounded bg-slate-700/70 animate-pulse" />
                                                <div className="h-3 w-1/2 rounded bg-slate-700/70 animate-pulse" />
                                                <div className="h-3 w-2/3 rounded bg-slate-700/70 animate-pulse" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </>
        );
    }
    // ====================
    // Renderizacao
    // ====================
    return (
        <>
            <Navbar />
            <ToastContainer position="bottom-right" />
            <div className="min-h-[calc(100vh-120px)] overflow-hidden text-slate-100 px-4 pb-4 pt-0">
                <div className="w-full max-w-8xl mx-auto">
                    
                    {/* Cabecalho */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <KanbanFill className="h-8 w-8 text-emerald-400" />
                            <div className="flex flex-col">
                                <h1 className="text-2xl font-semibold text-slate-50">Kanban Qualidade</h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 ml-auto">
                            {/* Filtro Projetos */}
                            <div className="flex items-center gap-2 relative">
                                <label className="text-sm text-slate-300">Projetos:</label>
                                <div
                                    ref={projectDropdownRef}
                                    className="group relative min-w-[180px] outline-none focus:outline-none focus-visible:outline-none"
                                    tabIndex={-1}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            setIsProjectDropdownOpen(false);
                                            return;
                                        }
                                        if (!isProjectDropdownOpen) return;
                                        const options = [
                                            { value: "all", label: "Selecione..." },
                                            ...projects.map((p) => ({
                                                value: String(p.id),
                                                label: p.name,
                                            })),
                                        ];
                                        handleTypeaheadSelect(
                                            event,
                                            options,
                                            setProjectTypeahead,
                                            setFilterProject,
                                            projectTypeaheadTimer,
                                            projectListRef,
                                        );
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setIsProjectDropdownOpen((prev) => !prev)}
                                        className="peer w-full rounded-xl border border-slate-700/80 bg-gradient-to-b from-slate-900/95 to-slate-900/80 py-2 pl-3 pr-9 text-left text-sm font-normal text-slate-100 shadow-sm shadow-slate-950/30 transition-all duration-150 cursor-pointer hover:border-blue-500/80 hover:shadow-blue-900/20 focus:outline-none focus:ring-0 focus:border-blue-500/80 focus:shadow-blue-900/20 focus-visible:outline-none focus-visible:ring-0"
                                        aria-haspopup="listbox"
                                        aria-expanded={isProjectDropdownOpen}
                                    >
                                        {filterProject === "all"
                                            ? "Selecione..."
                                            : projects.find((p) => String(p.id) === filterProject)?.name || "Selecione..."}
                                    </button>
                                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-300 transition-colors group-hover:text-blue-300">
                                        <ChevronDown className={`h-4 w-4 transition-transform duration-150 ${isProjectDropdownOpen ? "rotate-180" : ""}`} />
                                    </span>
                                    {isProjectDropdownOpen && (
                                        <div className="absolute z-30 mt-0.5 w-full overflow-hidden rounded-xl border border-slate-600/90 bg-slate-900/95 shadow-xl shadow-black/40 backdrop-blur-sm">
                                            <ul
                                                ref={projectListRef}
                                                className="max-h-60 overflow-y-auto py-1"
                                                role="listbox"
                                            >
                                                <li>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFilterProject("all");
                                                            setIsProjectDropdownOpen(false);
                                                        }}
                                                        data-option-value="all"
                                                        className={`w-full px-3 py-2 text-left text-sm font-normal transition-colors cursor-pointer ${
                                                            filterProject === "all"
                                                                ? "bg-blue-600/80 text-white"
                                                                : "text-slate-100 hover:bg-slate-700/80"
                                                        }`}
                                                    >
                                                        Selecione...
                                                    </button>
                                                </li>
                                                {projects.map((p) => (
                                                    <li key={p.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFilterProject(String(p.id));
                                                                setIsProjectDropdownOpen(false);
                                                            }}
                                                            data-option-value={String(p.id)}
                                                            className={`w-full px-3 py-2 text-left text-sm font-normal transition-colors cursor-pointer ${
                                                                filterProject === String(p.id)
                                                                    ? "bg-blue-600/80 text-white"
                                                                    : "text-slate-100 hover:bg-slate-700/80"
                                                            }`}
                                                        >
                                                            {p.name}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Filtro Responsaveis */}
                            <div className="flex items-center gap-2 relative ml-1">
                                <label className="text-sm text-slate-300">Responsáveis:</label>
                                <div
                                    ref={assignedDropdownRef}
                                    className="group relative min-w-[180px] outline-none focus:outline-none focus-visible:outline-none"
                                    tabIndex={-1}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            setIsAssignedDropdownOpen(false);
                                            return;
                                        }
                                        if (!isAssignedDropdownOpen) return;
                                        const options = [
                                            { value: "all", label: "Selecione..." },
                                            ...collaborators.map((c) => ({
                                                value: String(c.id),
                                                label: c.name,
                                            })),
                                        ];
                                        handleTypeaheadSelect(
                                            event,
                                            options,
                                            setAssignedTypeahead,
                                            setFilterAssignedTo,
                                            assignedTypeaheadTimer,
                                            assignedListRef,
                                        );
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setIsAssignedDropdownOpen((prev) => !prev)}
                                        className="peer w-full rounded-xl border border-slate-700/80 bg-gradient-to-b from-slate-900/95 to-slate-900/80 py-2 pl-3 pr-9 text-left text-sm font-normal text-slate-100 shadow-sm shadow-slate-950/30 transition-all duration-150 cursor-pointer hover:border-blue-500/80 hover:shadow-blue-900/20 focus:outline-none focus:ring-0 focus:border-blue-500/80 focus:shadow-blue-900/20 focus-visible:outline-none focus-visible:ring-0"
                                        aria-haspopup="listbox"
                                        aria-expanded={isAssignedDropdownOpen}
                                    >
                                        {filterAssignedTo === "all"
                                            ? "Selecione..."
                                            : collaborators.find((c) => String(c.id) === filterAssignedTo)?.name || "Selecione..."}
                                    </button>
                                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-300 transition-colors group-hover:text-blue-300">
                                        <ChevronDown className={`h-4 w-4 transition-transform duration-150 ${isAssignedDropdownOpen ? "rotate-180" : ""}`} />
                                    </span>
                                    {isAssignedDropdownOpen && (
                                        <div className="absolute z-30 mt-0.5 w-full overflow-hidden rounded-xl border border-slate-600/90 bg-slate-900/95 shadow-xl shadow-black/40 backdrop-blur-sm">
                                            <ul
                                                ref={assignedListRef}
                                                className="max-h-60 overflow-y-auto py-1"
                                                role="listbox"
                                            >
                                                <li>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFilterAssignedTo("all");
                                                            setIsAssignedDropdownOpen(false);
                                                        }}
                                                        data-option-value="all"
                                                        className={`w-full px-3 py-2 text-left text-sm font-normal transition-colors cursor-pointer ${
                                                            filterAssignedTo === "all"
                                                                ? "bg-blue-600/80 text-white"
                                                                : "text-slate-100 hover:bg-slate-700/80"
                                                        }`}
                                                    >
                                                        Selecione...
                                                    </button>
                                                </li>
                                                {collaborators.map((c) => (
                                                    <li key={c.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFilterAssignedTo(String(c.id));
                                                                setIsAssignedDropdownOpen(false);
                                                            }}
                                                            data-option-value={String(c.id)}
                                                            className={`w-full px-3 py-2 text-left text-sm font-normal transition-colors cursor-pointer ${
                                                                filterAssignedTo === String(c.id)
                                                                    ? "bg-blue-600/80 text-white"
                                                                    : "text-slate-100 hover:bg-slate-700/80"
                                                            }`}
                                                        >
                                                            {c.name}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Filtro Departamentos */}
                            <div className="flex items-center gap-2 relative ml-1">
                                <label className="text-sm text-slate-300">Setor:</label>
                                <div
                                    ref={departmentDropdownRef}
                                    className="group relative min-w-[180px] outline-none focus:outline-none focus-visible:outline-none"
                                    tabIndex={-1}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            setIsDepartmentDropdownOpen(false);
                                            return;
                                        }
                                        if (!isDepartmentDropdownOpen) return;
                                        const options = [
                                            { value: "all", label: "Selecione..." },
                                            ...departments.map((d) => ({
                                                value: String(d.id),
                                                label: d.name,
                                            })),
                                        ];
                                        handleTypeaheadSelect(
                                            event,
                                            options,
                                            setDepartmentTypeahead,
                                            setFilterDepartment,
                                            departmentTypeaheadTimer,
                                            departmentListRef,
                                        );
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setIsDepartmentDropdownOpen((prev) => !prev)}
                                        className="peer w-full rounded-xl border border-slate-700/80 bg-gradient-to-b from-slate-900/95 to-slate-900/80 py-2 pl-3 pr-9 text-left text-sm font-normal text-slate-100 shadow-sm shadow-slate-950/30 transition-all duration-150 cursor-pointer hover:border-blue-500/80 hover:shadow-blue-900/20 focus:outline-none focus:ring-0 focus:border-blue-500/80 focus:shadow-blue-900/20 focus-visible:outline-none focus-visible:ring-0"
                                        aria-haspopup="listbox"
                                        aria-expanded={isDepartmentDropdownOpen}
                                    >
                                        {filterDepartment === "all"
                                            ? "Selecione..."
                                            : departments.find((d) => String(d.id) === filterDepartment)?.name || "Selecione..."}
                                    </button>
                                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-300 transition-colors group-hover:text-blue-300">
                                        <ChevronDown className={`h-4 w-4 transition-transform duration-150 ${isDepartmentDropdownOpen ? "rotate-180" : ""}`} />
                                    </span>
                                    
                                    {isDepartmentDropdownOpen && (
                                        <div className="absolute z-30 mt-0.5 w-full overflow-hidden rounded-xl border border-slate-600/90 bg-slate-900/95 shadow-xl shadow-black/40 backdrop-blur-sm">
                                            <ul
                                                ref={departmentListRef}
                                                className="max-h-60 overflow-y-auto py-1"
                                                role="listbox"
                                            >
                                                
                                                <li>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFilterDepartment("all");
                                                            setIsDepartmentDropdownOpen(false);
                                                        }}
                                                        data-option-value="all"
                                                        className={`w-full px-3 py-2 text-left text-sm font-normal transition-colors cursor-pointer ${
                                                            filterDepartment === "all"
                                                                ? "bg-blue-600/80 text-white"
                                                                : "text-slate-100 hover:bg-slate-700/80"
                                                        }`}
                                                    >
                                                        Selecione...
                                                    </button>
                                                </li>

                                                {departments.map((d) => (
                                                    <li key={d.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFilterDepartment(String(d.id));
                                                                setIsDepartmentDropdownOpen(false);
                                                            }}
                                                            data-option-value={String(d.id)}
                                                            className={`w-full px-3 py-2 text-left text-sm font-normal transition-colors cursor-pointer ${
                                                                filterDepartment === String(d.id)
                                                                    ? "bg-blue-600/80 text-white"
                                                                    : "text-slate-100 hover:bg-slate-700/80"
                                                            }`}
                                                        >
                                                            {d.name}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>

                        <div className="flex items-center gap-1.5 ml-1">
                            <a
                                href="/kanban/tv"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-500/70 bg-purple-600 hover:bg-purple-700 text-[15px] font-medium text-white cursor-pointer shadow-sm shadow-purple-900/40 transition-colors"
                                title="Abrir versão para TV"
                            >
                                <Tv className="h-5.5 w-5.5" />
                                
                            </a>
                            {perms.canAdd && (
                                <button
                                    onClick={() => {
                                        setFormData(EMPTY_FORM);
                                        setModal({ type: "add" });
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-500/70 bg-blue-600 hover:bg-blue-700 text-[15px] font-medium text-white cursor-pointer shadow-sm shadow-blue-900/40 transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    Nova Task
                                </button>
                            )}
                        </div>

                    </div>
                    </div>

                    {/* Kanban Board */}
                    <div className="-mt-5 flex flex-wrap gap-4">
                        {COLUMNS.map((column) => {
                            const columnTasks = getTasksByStatus(column.id);
                            const Icon = column.icon;
                            const isCollapsed = collapsedColumns.has(column.id);
                            return (
                                <div
                                    key={column.id}
                                    className={[
                                        "bg-slate-800/50 rounded-xl border border-slate-700/50 flex flex-col h-[calc(100vh-170px)] transition-all",
                                        isCollapsed ? "w-14 items-center p-2" : "flex-1 min-w-[280px] pt-2 px-4 pb-4",
                                    ].join(" ")}
                                    onDragOver={handleDragOver}
                                    onDrop={() => handleDrop(column.id)}
                                >
                                    {/* Cabecalho da coluna */}
                                    <div className={isCollapsed ? "flex flex-col items-center gap-2" : "flex items-center justify-between mb-2"}>
                                        {!isCollapsed && (
                                            <div className="flex items-center gap-2">
                                                <Icon
                                                    className={
                                                        column.id === "IN_REVIEW"
                                                            ? "h-5 w-5 text-yellow-400"
                                                            : `h-5 w-5 text-${column.color}-400`
                                                    }
                                                />
                                                <h2 className="font-semibold text-slate-200">{column.title}</h2>
                                                <span className={`text-xs px-2 py-0.5 rounded-full bg-${column.color}-900/40 border border-${column.color}-600/40 text-${column.color}-300`}>
                                                    {columnTasks.length}
                                                </span>
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => toggleColumnCollapsed(column.id)}
                                            className="rounded-full border border-slate-600/70 bg-slate-900/70 text-slate-200 hover:text-blue-300 hover:border-blue-500/70 transition-colors w-7 h-7 flex items-center justify-center cursor-pointer"
                                            title={isCollapsed ? "Expandir coluna" : "Recolher coluna"}
                                        >
                                            <ChevronDown className={`h-3 w-3 ${isCollapsed ? "-rotate-90" : "rotate-90"} transition-transform`} />
                                        </button>
                                        {isCollapsed && (
                                            <>
                                                <div
                                                    className={`font-semibold uppercase tracking-wide text-${column.color}-300`}
                                                    style={{ fontSize: "18px" }}
                                                >
                                                    {columnTasks.length}
                                                </div>
                                                <div
                                                    className={`font-semibold text-${column.color}-200`}
                                                    style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: "16px" }}
                                                >
                                                    {column.title}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    {!isCollapsed && (
                                        <>
                                            {/* Tasks */}
                                            {columnTasks.length === 0 ? (
                                                <div className="flex-1 min-h-[200px] overflow-y-auto pr-1 flex items-center justify-center">
                                                    <div className="text-center py-8 text-slate-500 text-sm">
                                                        Nenhuma Task
                                                    </div>
                                                </div>
                                            ) : (
                                                <ColumnTaskList
                                                    tasks={columnTasks}
                                                    renderTask={(task) => {
                                                        const subtaskCount = task.subtasks?.length ?? 0;
                                                        const doneSubtasks = (task.subtasks || []).filter((s) => s.is_done).length;
                                            return (
                                                            <div className="pb-3">
                                                                <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-700 rounded-xl overflow-hidden hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all group">
                                                
                                                {/* Container superior - cabecalho */}
                                                <div
                                                    draggable={perms.canChange}
                                                    onDragStart={(e) => handleDragStart(e, task)}
                                                    className="bg-slate-800/50 border-b border-slate-700/50 p-3 cursor-move">

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
                                                                <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-max max-w-[320px] opacity-0 transition-opacity duration-150 group-hover/title:opacity-100">
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

                                                            {task.responsavel_name && (
                                                                <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-200 bg-slate-900/30 px-2 py-1 rounded-md border border-slate-700/60 max-w-[220px]">
                                                                    <User className="h-3.5 w-3.5 text-blue-400" />
                                                                    <span className="truncate font-medium">{task.responsavel_name}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex shrink-0 items-center gap-1.5">
                                                            {perms.canChange && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        startEdit(task);
                                                                    }}
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-blue-300 cursor-pointer"
                                                                    title="Editar Task"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                            {perms.canDelete && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (task.id) {
                                                                            setModal({ type: "delete", id: task.id, title: task.title });
                                                                        }
                                                                    }}
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 p-1 cursor-pointer"
                                                                >
                                                                    <Trash className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Container Inferior - Descrição e Responsável */}
                                                {expandedTasks.has(task.id || 0) && (
                                                <div className="p-2 space-y-3">
                                                    {task.description && (
                                                        <div className="space-y-2">
                                                            <div className="flex justify-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleTaskDescription(task.id || 0)}
                                                                    className="flex items-center justify-center gap-1 text-[11px] text-slate-300 hover:text-blue-300 cursor-pointer"
                                                                    title="Ver Descrição"
                                                                >
                                                                    <span className="flex items-center gap-1 rounded-md bg-slate-800/70 border border-slate-700/60 px-2 py-1">
                                                                        <FileText className="h-3 w-3" />
                                                                        <span>
                                                                            {descriptionTasks.has(task.id || 0) ? "Ocultar" : "Ver Descrição"}
                                                                        </span>
                                                                    </span>
                                                                </button>
                                                            </div>

                                                            {descriptionTasks.has(task.id || 0) && (
                                                                <div className="bg-slate-800/30 rounded-lg p-2.5 border border-slate-700/50">
                                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1.5">Descrição</p>
                                                                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                                                                        {task.description}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            <div className="border-t border-slate-700/60" />
                                                        </div>
                                                    )}


                                                    {/* Responsaveis e Setores */}
                                                    <div className="space-y-2 -mt-1">
                                                        {(() => {
                                                            const assignedNames =
                                                                task.assigned_to_names?.length
                                                                    ? task.assigned_to_names
                                                                    : (task.assigned_to || [])
                                                                          .map((id) => collaborators.find((c) => c.id === id)?.name)
                                                                          .filter(Boolean) as string[];
                                                            if (!assignedNames.length) return null;
                                                            return (
                                                                <div className="flex items-center gap-2 bg-gradient-to-r from-blue-900/20 to-transparent px-3 py-2 rounded-lg border border-blue-700/30">
                                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-900/50 border border-blue-600/50">
                                                                        <User className="h-4 w-4 text-blue-300" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wide">Responsáveis</p>
                                                                        <p className="text-sm text-slate-200 font-medium truncate">
                                                                            {assignedNames.join(", ")}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                        {(() => {
                                                            const deptNames =
                                                                task.department_names?.length
                                                                    ? task.department_names
                                                                    : (task.department || [])
                                                                          .map((id) => departments.find((d) => d.id === id)?.name)
                                                                          .filter(Boolean) as string[];
                                                            if (!deptNames.length) return null;
                                                            return (
                                                                <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-900/20 to-transparent px-3 py-2 rounded-lg border border-emerald-700/30">
                                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-900/50 border border-emerald-600/50">
                                                                        <Building2 className="h-4 w-4 text-emerald-300" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wide">Setores</p>
                                                                        <p className="text-sm text-slate-200 font-medium truncate">
                                                                            {deptNames.join(", ")}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>

                                                    {/* Subtarefas */}
                                                    <div className="space-y-2 border-t border-slate-700/60 pt-2">
                                                        <div className="flex items-center gap-1">
                                                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                                                                Subtarefas
                                                            </p>
                                                            {perms.canChange && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (!task.id) return;
                                                                        addSubtaskDraft(task.id);
                                                                    }}
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
                                                                onDrop={(e) => {
                                                                    if (!task.id || !perms.canChange) return;
                                                                    handleSubtaskDrop(e, task.id);
                                                                }}
                                                            >
                                                                {sortSubtasks(task.subtasks).map((subtask) => {
                                                                    const isEditingThisSubtask = editingSubtaskId === subtask.id;
                                                                    return (
                                                                    <div
                                                                        key={subtask.id}
                                                                        data-subtask-dnd="true"
                                                                        draggable={perms.canChange && !isEditingThisSubtask}
                                                                        onDragStart={(e) => {
                                                                            if (!task.id || !subtask.id || isEditingThisSubtask) return;
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
                                                                                const isAfter = e.clientY > rect.top + rect.height / 2;
                                                                                setDropTargetPosition(isAfter ? "after" : "before");
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
                                                                            isEditingThisSubtask ? "cursor-text" : perms.canChange ? "cursor-move" : "",
                                                                            draggedSubtask?.subtaskId === subtask.id
                                                                                ? "opacity-70"
                                                                                : "",
                                                                            dropTargetSubtaskId === subtask.id
                                                                                ? dropTargetPosition === "after"
                                                                                    ? "border-blue-400/70 bg-blue-500/10 translate-y-[1px]"
                                                                                    : "border-blue-400/70 bg-blue-500/10 -translate-y-[1px]"
                                                                                : "",
                                                                        ].join(" ")}
                                                                    >
                                                                        <label className={`flex items-start gap-2 ${isEditingThisSubtask ? "cursor-text" : "cursor-pointer"}`}>
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={subtask.is_done}
                                                                                disabled={isEditingThisSubtask}
                                                                                onChange={() => {
                                                                                    if (!subtask.id || isEditingThisSubtask) return;
                                                                                    updateSubtask(subtask.id, { is_done: !subtask.is_done });
                                                                                }}
                                                                                className="mt-0.5 h-4 w-4 shrink-0 appearance-none rounded-full border border-slate-600 bg-slate-900 cursor-pointer transition-colors checked:border-blue-500 checked:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                                                                            />
                                                                            {isEditingThisSubtask ? (
                                                                                <span className={`flex-1 whitespace-pre-wrap break-words ${
                                                                                    subtask.is_done ? "line-through text-slate-400" : "text-slate-100"
                                                                                }`}>
                                                                                    <span aria-hidden>- </span>
                                                                                    <span
                                                                                        ref={editingSubtaskRef}
                                                                                        contentEditable
                                                                                        suppressContentEditableWarning
                                                                                        onBlur={async () => {
                                                                                            if (!subtask.id) return;
                                                                                            const currentText =
                                                                                                editingSubtaskRef.current?.textContent ??
                                                                                                editingSubtaskTitle;
                                                                                            const trimmed = currentText.trim();
                                                                                            if (trimmed) {
                                                                                                await updateSubtask(subtask.id, { title: trimmed });
                                                                                            }
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
                                                                                            // Enter mantem a edicao e cria quebra de linha.
                                                                                            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                                                                                e.preventDefault();
                                                                                                if (!subtask.id) return;
                                                                                                const currentText =
                                                                                                    editingSubtaskRef.current?.textContent ??
                                                                                                    editingSubtaskTitle;
                                                                                                const trimmed = currentText.trim();
                                                                                                if (trimmed) {
                                                                                                    await updateSubtask(subtask.id, { title: trimmed });
                                                                                                }
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
                                                                                    disabled={isEditingThisSubtask}
                                                                                    onClick={() => {
                                                                                        if (!task.id || !subtask.id) return;
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
                                                                                    disabled={isEditingThisSubtask}
                                                                                    onClick={() => {
                                                                                        if (!subtask.id) return;
                                                                                        deleteSubtask(subtask.id);
                                                                                    }}
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
                                                                        onChange={(e) =>
                                                                            updateSubtaskDraft(
                                                                                task.id as number,
                                                                                draft.id,
                                                                                e.target.value,
                                                                            )
                                                                        }
                                                                        onBlur={async () => {
                                                                            if (!task.id) return;
                                                                            const didCreate = await addSubtask(task.id, draft.title);
                                                                            if (didCreate || !draft.title.trim()) {
                                                                                removeSubtaskDraft(task.id, draft.id);
                                                                            }
                                                                        }}
                                                                        onKeyDown={async (e) => {
                                                                            if (e.key !== "Enter") return;
                                                                            e.preventDefault();
                                                                            if (!task.id) return;
                                                                            const didCreate = await addSubtask(task.id, draft.title);
                                                                            if (didCreate || !draft.title.trim()) {
                                                                                removeSubtaskDraft(task.id, draft.id);
                                                                            }
                                                                        }}
                                                                        className="flex-1 bg-transparent outline-none text-slate-100 placeholder:text-slate-600"
                                                                        placeholder="Nome da subtarefa..."
                                                                        autoFocus
                                                                    />
                                                                </div>
                                                            ))}
                                                    </div>

                                                    {/* Botao de edicao */}
                                                    {perms.canChange && (
                                                        <div className="flex justify-center gap-2 -mt-2">
                                                            {task.status === "DONE" && task.solution && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSolutionModal({
                                                                            open: true,
                                                                            taskId: task.id || 0,
                                                                            solution: task.solution || "",
                                                                        });
                                                                    }}
                                                                    className="py-2 px-3 text-xs font-medium bg-emerald-700/30 hover:bg-emerald-700/50 border border-emerald-600/60 hover:border-emerald-500 rounded-lg transition-all text-emerald-200 hover:text-emerald-100 cursor-pointer"
                                                                >
                                                                    Ver Solução
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                )}

                                                {/* Botao de expandir/recolher */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleTaskExpanded(task.id || 0);
                                                    }}
                                                    className="w-full py-1 text-xs font-medium bg-slate-800/30 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 rounded-b-lg transition-all text-slate-300 hover:text-slate-200 flex items-center justify-center gap-1 cursor-pointer"
                                                >
                                                    {expandedTasks.has(task.id || 0) ? (
                                                        <>
                                                            <ChevronDown className="h-3 w-3 rotate-180" />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown className="h-3 w-3" />
                                                        </>
                                                    )}
                                                </button>
                                                </div>
                                                                </div>
                                                    );
                                                }}
                                                />
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {/* Modal: adicionar task */}
            {modal.type === "add" && (
                
                <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setModal({ type: null })}>
                    <div onClick={(event) => event.stopPropagation()} className="bg-slate-900/90 rounded-2xl p-6 w-full max-w-lg border border-slate-700/80 shadow-xl max-h-[100vh] overflow-y-auto">
                        
                        <div className="mb-2">
                            <span className="text-xs uppercase tracking-wide text-slate-400">Nova task</span>
                            <h2 className="text-2xl font-semibold text-slate-100">Nova Task</h2>
                        </div>
                        <div className="h-px w-full bg-slate-700/70 mb-2" />
                        
                        <form onSubmit={handleSubmitAdd} className="space-y-3 text-slate-100 text-sm">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Título:*</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ex: Desenvolver funcionalidade de login"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Descrição:</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Ex: Implementar a funcionalidade de login."
                                    />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Responsável:</label>
                                    <select
                                        value={formData.responsavel ?? ""}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, responsavel: e.target.value ? Number(e.target.value) : null }))}
                                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Selecione...</option>
                                        {collaborators.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Prioridade:</label>
                                    <div ref={addPriorityDropdownRef} className="group relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddPriorityDropdownOpen((prev) => !prev)}
                                            aria-haspopup="listbox"
                                            aria-expanded={isAddPriorityDropdownOpen}
                                            className="peer w-full rounded-xl border border-slate-700/80 bg-gradient-to-b from-slate-900/95 to-slate-900/80 py-2.5 pl-3 pr-10 text-left text-sm font-normal text-slate-100 shadow-sm shadow-slate-950/30 transition-all duration-150 cursor-pointer hover:border-blue-500/80 hover:shadow-blue-900/20 focus:outline-none focus:ring-0 focus:border-blue-500/80 focus:shadow-blue-900/20"
                                        >
                                            {PRIORITY_LABELS[formData.priority]}
                                        </button>
                                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-300 transition-colors group-hover:text-blue-300">
                                            <ChevronDown className={`h-4 w-4 transition-transform duration-150 ${isAddPriorityDropdownOpen ? "rotate-180" : ""}`} />
                                        </span>
                                        {isAddPriorityDropdownOpen && (
                                            <div className="absolute z-30 mt-0.5 w-full overflow-hidden rounded-xl border border-slate-600/90 bg-slate-900/95 shadow-xl shadow-black/40 backdrop-blur-sm">
                                                <ul className="max-h-60 overflow-y-auto py-1" role="listbox">
                                                    {(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).map((priority) => (
                                                        <li key={priority}>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData((prev) => ({ ...prev, priority }));
                                                                    setIsAddPriorityDropdownOpen(false);
                                                                }}
                                                                className={`w-full px-3 py-2 text-left text-sm transition cursor-pointer ${formData.priority === priority ? "bg-blue-600/90 text-white" : "text-slate-200 hover:bg-slate-800/90"}`}
                                                            >
                                                                {PRIORITY_LABELS[priority]}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300">Responsáveis:</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1.5">Disponíveis:</p>
                                        <div
                                            className="bg-slate-900 border border-slate-700 rounded-lg p-2 min-h-[60px] max-h-[80px] overflow-y-auto"
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const id = Number(e.dataTransfer.getData("collaborator-id"));
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    assigned_to: (prev.assigned_to || []).filter((cId) => cId !== id),
                                                }));
                                            }}
                                        >
                                            {collaborators
                                                .filter((c) => !(formData.assigned_to || []).includes(c.id))
                                                .map((c) => (
                                                    <div
                                                        key={c.id}
                                                        draggable
                                                        onDragStart={(e) => {
                                                            e.dataTransfer.setData("collaborator-id", String(c.id));
                                                        }}
                                                        className="px-2 py-1.5 mb-1.5 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200 cursor-move hover:bg-slate-700 hover:border-blue-500 transition-colors"
                                                    >
                                                        {c.name}
                                                    </div>
                                                ))}
                                            {collaborators.filter((c) => !(formData.assigned_to || []).includes(c.id)).length === 0 && (
                                                <p className="text-xs text-slate-500 text-center py-4">Todos selecionados</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1.5">Selecionados:</p>
                                        <div
                                            className="bg-slate-900 border border-blue-600/50 rounded-lg p-2 min-h-[60px] max-h-[80px] overflow-y-auto"
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const id = Number(e.dataTransfer.getData("collaborator-id"));
                                                setFormData((prev) => {
                                                    const current = prev.assigned_to || [];
                                                    if (current.includes(id)) return prev;
                                                    return { ...prev, assigned_to: [...current, id] };
                                                });
                                            }}
                                        >
                                            {(formData.assigned_to || []).map((cId) => {
                                                const collab = collaborators.find((c) => c.id === cId);
                                                return collab ? (
                                                    <div
                                                        key={collab.id}
                                                        draggable
                                                        onDragStart={(e) => {
                                                            e.dataTransfer.setData("collaborator-id", String(collab.id));
                                                        }}
                                                        className="px-2 py-1.5 mb-1.5 bg-blue-900/40 border border-blue-600/60 rounded text-xs text-blue-200 cursor-move hover:bg-blue-800/50 hover:border-blue-500 transition-colors"
                                                    >
                                                        {collab.name}
                                                    </div>
                                                ) : null;
                                            })}
                                            {(!formData.assigned_to || formData.assigned_to.length === 0) && (
                                                <p className="text-xs text-slate-500 text-center py-4">Arraste aqui</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300">Setores:</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1.5">Disponiveis:</p>
                                        <div
                                            className="bg-slate-900 border border-slate-700 rounded-lg p-2 min-h-[60px] max-h-[80px] overflow-y-auto"
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const id = Number(e.dataTransfer.getData("department-id"));
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    department: (prev.department || []).filter((dId) => dId !== id),
                                                }));
                                            }}
                                        >
                                            {departments
                                                .filter((d) => !(formData.department || []).includes(d.id))
                                                .map((d) => (
                                                    <div
                                                        key={d.id}
                                                        draggable
                                                        onDragStart={(e) => {
                                                            e.dataTransfer.setData("department-id", String(d.id));
                                                        }}
                                                        className="px-2 py-1.5 mb-1.5 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200 cursor-move hover:bg-slate-700 hover:border-emerald-500 transition-colors"
                                                    >
                                                        {d.name}
                                                    </div>
                                                ))}
                                            {departments.filter((d) => !(formData.department || []).includes(d.id)).length === 0 && (
                                                <p className="text-xs text-slate-500 text-center py-4">Todos selecionados</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1.5">Selecionados:</p>
                                        <div
                                            className="bg-slate-900 border border-emerald-600/50 rounded-lg p-2 min-h-[60px] max-h-[80px] overflow-y-auto"
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const id = Number(e.dataTransfer.getData("department-id"));
                                                setFormData((prev) => {
                                                    const current = prev.department || [];
                                                    if (current.includes(id)) return prev;
                                                    return { ...prev, department: [...current, id] };
                                                });
                                            }}
                                        >
                                            {(formData.department || []).map((dId) => {
                                                const dept = departments.find((d) => d.id === dId);
                                                return dept ? (
                                                    <div
                                                        key={dept.id}
                                                        draggable
                                                        onDragStart={(e) => {
                                                            e.dataTransfer.setData("department-id", String(dept.id));
                                                        }}
                                                        className="px-2 py-1.5 mb-1.5 bg-emerald-900/40 border border-emerald-600/60 rounded text-xs text-emerald-200 cursor-move hover:bg-emerald-800/50 hover:border-emerald-500 transition-colors"
                                                    >
                                                        {dept.name}
                                                    </div>
                                                ) : null;
                                            })}
                                            {(!formData.department || formData.department.length === 0) && (
                                                <p className="text-xs text-slate-500 text-center py-4">Arraste aqui</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <DateInputBRNative
                                    label="Data Início:"
                                    valueISO={formData.start_date || ""}
                                    onChangeISO={(iso) => setFormData((prev) => ({ ...prev, start_date: iso || null }))}
                                />
                                <DateInputBRNative
                                    label="Prazo:"
                                    valueISO={formData.deadline || ""}
                                    onChangeISO={(iso) => setFormData((prev) => ({ ...prev, deadline: iso || null }))}
                                />
                            </div>
                            <div className="flex justify-center gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setModal({ type: null })}
                                    className="px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-medium text-white cursor-pointer min-w-[140px]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white disabled:opacity-50 cursor-pointer min-w-[120px]"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Salvando..." : "Salvar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Modal: editar task */}
            {modal.type === "edit" && (
                <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setModal({ type: null })}>
                    <div onClick={(event) => event.stopPropagation()} className="bg-slate-900/90 rounded-2xl p-4 w-full max-w-lg border border-slate-700/80 shadow-xl max-h-[100vh] overflow-y-auto">
                        <div className="mb-2">
                            <span className="text-xs uppercase tracking-wide text-slate-400">Editar task</span>
                            <h2 className="text-2xl font-semibold text-slate-100">Editar Task</h2>
                        </div>
                        <div className="h-px w-full bg-slate-700/70 mb-2" />
                        <form onSubmit={handleEditSubmit} className="space-y-3 text-slate-100 text-sm">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Título:*</label>
                                <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Descrição:</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                />
                            </div>
                            {editForm.status === "DONE" && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Solução/Conclusão:*</label>
                                    <textarea
                                        value={editForm.solution || ""}
                                        onChange={(e) => setEditForm({ ...editForm, solution: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                        required
                                    />
                                </div>
                            )}
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Status:</label>
                                    <div ref={editStatusDropdownRef} className="group relative">
                                        <button type="button" onClick={() => setIsEditStatusDropdownOpen((prev) => !prev)} aria-haspopup="listbox" aria-expanded={isEditStatusDropdownOpen} className="peer w-full rounded-xl border border-slate-700/80 bg-gradient-to-b from-slate-900/95 to-slate-900/80 py-2.5 pl-3 pr-10 text-left text-sm font-normal text-slate-100 shadow-sm shadow-slate-950/30 transition-all duration-150 cursor-pointer hover:border-blue-500/80 hover:shadow-blue-900/20 focus:outline-none focus:ring-0 focus:border-blue-500/80 focus:shadow-blue-900/20">
                                            {{ TODO: "A Fazer", IN_PROGRESS: "Em Progresso", IN_REVIEW: "Em Revisão", DONE: "Concluída" }[editForm.status]}
                                        </button>
                                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-300 transition-colors group-hover:text-blue-300"><ChevronDown className={`h-4 w-4 transition-transform duration-150 ${isEditStatusDropdownOpen ? "rotate-180" : ""}`} /></span>
                                        {isEditStatusDropdownOpen && (
                                            <div className="absolute z-30 mt-0.5 w-full overflow-hidden rounded-xl border border-slate-600/90 bg-slate-900/95 shadow-xl shadow-black/40 backdrop-blur-sm">
                                                <ul className="max-h-60 overflow-y-auto py-1" role="listbox">
                                                    {(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const).map((status) => (
                                                        <li key={status}><button type="button" onClick={() => { setEditForm((prev) => ({ ...prev, status })); setIsEditStatusDropdownOpen(false); }} className={`w-full px-3 py-2 text-left text-sm transition cursor-pointer ${editForm.status === status ? "bg-blue-600/90 text-white" : "text-slate-200 hover:bg-slate-800/90"}`}>{{ TODO: "A Fazer", IN_PROGRESS: "Em Progresso", IN_REVIEW: "Em Revis?o", DONE: "Conclu?da" }[status]}</button></li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Prioridade:</label>
                                    <div ref={editPriorityDropdownRef} className="group relative">
                                        <button type="button" onClick={() => setIsEditPriorityDropdownOpen((prev) => !prev)} aria-haspopup="listbox" aria-expanded={isEditPriorityDropdownOpen} className="peer w-full rounded-xl border border-slate-700/80 bg-gradient-to-b from-slate-900/95 to-slate-900/80 py-2.5 pl-3 pr-10 text-left text-sm font-normal text-slate-100 shadow-sm shadow-slate-950/30 transition-all duration-150 cursor-pointer hover:border-blue-500/80 hover:shadow-blue-900/20 focus:outline-none focus:ring-0 focus:border-blue-500/80 focus:shadow-blue-900/20">
                                            {PRIORITY_LABELS[editForm.priority]}
                                        </button>
                                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-300 transition-colors group-hover:text-blue-300"><ChevronDown className={`h-4 w-4 transition-transform duration-150 ${isEditPriorityDropdownOpen ? "rotate-180" : ""}`} /></span>
                                        {isEditPriorityDropdownOpen && (
                                            <div className="absolute z-30 mt-0.5 w-full overflow-hidden rounded-xl border border-slate-600/90 bg-slate-900/95 shadow-xl shadow-black/40 backdrop-blur-sm">
                                                <ul className="max-h-60 overflow-y-auto py-1" role="listbox">
                                                    {(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).map((priority) => (
                                                        <li key={priority}><button type="button" onClick={() => { setEditForm((prev) => ({ ...prev, priority })); setIsEditPriorityDropdownOpen(false); }} className={`w-full px-3 py-2 text-left text-sm transition cursor-pointer ${editForm.priority === priority ? "bg-blue-600/90 text-white" : "text-slate-200 hover:bg-slate-800/90"}`}>{PRIORITY_LABELS[priority]}</button></li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Responsável:</label>
                                    <select
                                        value={editForm.responsavel ?? ""}
                                        onChange={(e) => setEditForm((prev) => ({ ...prev, responsavel: e.target.value ? Number(e.target.value) : null }))}
                                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Selecione...</option>
                                        {collaborators.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300">Responsáveis:</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1.5">Disponíveis:</p>
                                        <div
                                            className="bg-slate-900 border border-slate-700 rounded-lg p-2 min-h-[60px] max-h-[80px] overflow-y-auto"
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const id = Number(e.dataTransfer.getData("collaborator-id"));
                                                setEditForm((prev) => ({
                                                    ...prev,
                                                    assigned_to: (prev.assigned_to || []).filter((cId) => cId !== id),
                                                }));
                                            }}
                                        >
                                            {collaborators
                                                .filter((c) => !(editForm.assigned_to || []).includes(c.id))
                                                .map((c) => (
                                                    <div
                                                        key={c.id}
                                                        draggable
                                                        onDragStart={(e) => {
                                                            e.dataTransfer.setData("collaborator-id", String(c.id));
                                                        }}
                                                        className="px-2 py-1.5 mb-1.5 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200 cursor-move hover:bg-slate-700 hover:border-blue-500 transition-colors"
                                                    >
                                                        {c.name}
                                                    </div>
                                                ))}
                                            {collaborators.filter((c) => !(editForm.assigned_to || []).includes(c.id)).length === 0 && (
                                                <p className="text-xs text-slate-500 text-center py-4">Todos selecionados</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1.5">Selecionados:</p>
                                        <div
                                            className="bg-slate-900 border border-blue-600/50 rounded-lg p-2 min-h-[60px] max-h-[80px] overflow-y-auto"
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const id = Number(e.dataTransfer.getData("collaborator-id"));
                                                setEditForm((prev) => {
                                                    const current = prev.assigned_to || [];
                                                    if (current.includes(id)) return prev;
                                                    return { ...prev, assigned_to: [...current, id] };
                                                });
                                            }}
                                        >
                                            {(editForm.assigned_to || []).map((cId) => {
                                                const collab = collaborators.find((c) => c.id === cId);
                                                return collab ? (
                                                    <div
                                                        key={collab.id}
                                                        draggable
                                                        onDragStart={(e) => {
                                                            e.dataTransfer.setData("collaborator-id", String(collab.id));
                                                        }}
                                                        className="px-2 py-1.5 mb-1.5 bg-blue-900/40 border border-blue-600/60 rounded text-xs text-blue-200 cursor-move hover:bg-blue-800/50 hover:border-blue-500 transition-colors"
                                                    >
                                                        {collab.name}
                                                    </div>
                                                ) : null;
                                            })}
                                            {(!editForm.assigned_to || editForm.assigned_to.length === 0) && (
                                                <p className="text-xs text-slate-500 text-center py-4">Arraste aqui</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300">Setores:</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1.5">Disponíveis:</p>
                                        <div
                                            className="bg-slate-900 border border-slate-700 rounded-lg p-2 min-h-[60px] max-h-[80px] overflow-y-auto"
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const id = Number(e.dataTransfer.getData("department-id"));
                                                setEditForm((prev) => ({
                                                    ...prev,
                                                    department: (prev.department || []).filter((dId) => dId !== id),
                                                }));
                                            }}
                                        >
                                            {departments
                                                .filter((d) => !(editForm.department || []).includes(d.id))
                                                .map((d) => (
                                                    <div
                                                        key={d.id}
                                                        draggable
                                                        onDragStart={(e) => {
                                                            e.dataTransfer.setData("department-id", String(d.id));
                                                        }}
                                                        className="px-2 py-1.5 mb-1.5 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200 cursor-move hover:bg-slate-700 hover:border-emerald-500 transition-colors"
                                                    >
                                                        {d.name}
                                                    </div>
                                                ))}
                                            {departments.filter((d) => !(editForm.department || []).includes(d.id)).length === 0 && (
                                                <p className="text-xs text-slate-500 text-center py-4">Todos selecionados</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1.5">Selecionados:</p>
                                        <div
                                            className="bg-slate-900 border border-emerald-600/50 rounded-lg p-2 min-h-[60px] max-h-[80px] overflow-y-auto"
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const id = Number(e.dataTransfer.getData("department-id"));
                                                setEditForm((prev) => {
                                                    const current = prev.department || [];
                                                    if (current.includes(id)) return prev;
                                                    return { ...prev, department: [...current, id] };
                                                });
                                            }}
                                        >
                                            {(editForm.department || []).map((dId) => {
                                                const dept = departments.find((d) => d.id === dId);
                                                return dept ? (
                                                    <div
                                                        key={dept.id}
                                                        draggable
                                                        onDragStart={(e) => {
                                                            e.dataTransfer.setData("department-id", String(dept.id));
                                                        }}
                                                        className="px-2 py-1.5 mb-1.5 bg-emerald-900/40 border border-emerald-600/60 rounded text-xs text-emerald-200 cursor-move hover:bg-emerald-800/50 hover:border-emerald-500 transition-colors"
                                                    >
                                                        {dept.name}
                                                    </div>
                                                ) : null;
                                            })}
                                            {(!editForm.department || editForm.department.length === 0) && (
                                                <p className="text-xs text-slate-500 text-center py-4">Arraste aqui</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <DateInputBRNative
                                    label="Data Início:"
                                    valueISO={editForm.start_date || ""}
                                    onChangeISO={(iso) => setEditForm((prev) => ({ ...prev, start_date: iso || null }))}
                                />
                                <DateInputBRNative
                                    label="Prazo:"
                                    valueISO={editForm.deadline || ""}
                                    onChangeISO={(iso) => setEditForm((prev) => ({ ...prev, deadline: iso || null }))}
                                />
                            </div>
                            <div className="flex justify-center gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setModal({ type: null })}
                                    className="px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-medium text-white cursor-pointer min-w-[140px]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white disabled:opacity-50 cursor-pointer min-w-[120px]"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal: excluir task */}
            {modal.type === "delete" && (
                <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setModal({ type: null })}>
                    <div onClick={(event) => event.stopPropagation()} className="bg-slate-900/90 rounded-2xl p-6 w-full max-w-lg border border-slate-700/80 shadow-xl shadow-slate-950/60">
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
                            <button
                                onClick={async () => {
                                    await deleteTask(modal.id);
                                    setModal({ type: null });
                                }}
                                className="flex-1 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-medium text-white cursor-pointer shadow-sm shadow-red-900/40"
                            >
                                Excluir
                            </button>
                            <button
                                onClick={() => setModal({ type: null })}
                                className="flex-1 px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-medium text-white cursor-pointer"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {reopenModal.open && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setReopenModal({ open: false, taskId: null, nextStatus: null })}>
                    <div onClick={(event) => event.stopPropagation()} className="bg-slate-900/95 rounded-2xl p-6 w-full max-w-md border border-slate-700/80 shadow-xl">
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div className="flex flex-col">
                                <span className="text-xs uppercase tracking-wide text-slate-400">Reabrir Task</span>
                                <h2 className="text-2xl font-semibold text-slate-100">Reabrir Task</h2>
                            </div>
                        </div>
                        <div className="h-px w-full bg-slate-700/70 mb-2" />
                        <p className="text-slate-200 text-sm mb-5">
                            Tem certeza que deseja reabrir a Task ?
                        </p>
                        <div className="flex gap-3 pt-3 justify-center">
                            <button
                                type="button"
                                onClick={() =>
                                    setReopenModal({ open: false, taskId: null, nextStatus: null })
                                }
                                className="px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-medium text-white cursor-pointer min-w-[140px]"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!reopenModal.taskId || !reopenModal.nextStatus) return;
                                    await updateTask(reopenModal.taskId, { status: reopenModal.nextStatus });
                                    setReopenModal({ open: false, taskId: null, nextStatus: null });
                                }}
                                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white cursor-pointer min-w-[140px]"
                            >
                                Reabrir
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {doneModal.open && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setDoneModal({ open: false, taskId: null, solution: "" })}>
                    <div onClick={(event) => event.stopPropagation()} className="bg-slate-900/95 rounded-2xl p-6 w-full max-w-lg border border-slate-700/80 shadow-xl">
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
                                <textarea
                                    value={doneModal.solution}
                                    onChange={(e) => setDoneModal((prev) => ({ ...prev, solution: e.target.value }))}
                                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={4}
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-3 justify-center">
                            <button
                                type="button"
                                onClick={() => setDoneModal({ open: false, taskId: null, solution: "" })}
                                className="px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-medium text-white cursor-pointer min-w-[140px]"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!doneModal.taskId) return;
                                    if (!doneModal.solution.trim()) {
                                        toast.error("Informe a solução para concluir a task.");
                                        return;
                                    }
                                    await updateTask(doneModal.taskId, {
                                        status: "DONE",
                                        solution: doneModal.solution.trim(),
                                    });
                                    setDoneModal({ open: false, taskId: null, solution: "" });
                                }}
                                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white cursor-pointer min-w-[140px]"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {solutionModal.open && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSolutionModal({ open: false, taskId: null, solution: "" })}>
                    <div onClick={(event) => event.stopPropagation()} className="bg-slate-900/95 rounded-2xl p-6 w-full max-w-lg border border-slate-700/80 shadow-xl">
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div className="flex flex-col">
                                <span className="text-xs uppercase tracking-wide text-slate-400">{"Solução/Conclusão da Task"}</span>
                                <h2 className="text-2xl font-semibold text-slate-100">
                                    {(() => {
                                        const task = tasks.find((t) => t.id === solutionModal.taskId);
                                        return task?.title ? `Solução/Conclusão:  ${task.title}` : "Solução da Task";
                                    })()}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSolutionModal({ open: false, taskId: null, solution: "" })}
                                className="inline-flex items-center justify-center rounded-lg border border-slate-700/80 bg-slate-900/80 p-1.5 text-slate-200 hover:border-slate-500 hover:text-white transition-colors cursor-pointer"
                                aria-label="Fechar modal"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="h-px w-full bg-slate-700/70 mb-2" />
                        <div className="space-y-3">
                            <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                                <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">
                                    {solutionModal.solution}
                                </p>
                            </div>
                        </div>
                        <div className="pt-2" />
                    </div>
                </div>
            )}
        </>
    );
}




import { AlertCircle, CheckCircle2, Clock, FileText } from "lucide-react";
import type { Task } from "./types";

export const COLUMNS = [
    { id: "TODO", title: "A FAZER", icon: AlertCircle, color: "slate" },
    { id: "IN_PROGRESS", title: "EM PROGRESSO", icon: Clock, color: "blue" },
    { id: "IN_REVIEW", title: "EM REVISÃO", icon: FileText, color: "yellow" },
    { id: "DONE", title: "CONCLUÍDO", icon: CheckCircle2, color: "emerald" },
] as const;

export const PRIORITY_COLORS = {
    LOW: { bg: "bg-slate-600/20", border: "border-slate-600/40", text: "text-slate-300" },
    MEDIUM: { bg: "bg-blue-600/20", border: "border-blue-600/40", text: "text-blue-300" },
    HIGH: { bg: "bg-orange-600/20", border: "border-orange-600/40", text: "text-orange-300" },
    URGENT: { bg: "bg-red-600/20", border: "border-red-600/40", text: "text-red-300" },
};

export const PRIORITY_LABELS = {
    LOW: "Baixa",
    MEDIUM: "Média",
    HIGH: "Alta",
    URGENT: "Urgente",
};

export const STATUS_LABELS: Record<Task["status"], string> = {
    TODO: "A Fazer",
    IN_PROGRESS: "Em Progresso",
    IN_REVIEW: "Em Revisão",
    DONE: "Concluída",
};

export const TASK_REFRESH_INTERVAL = 5_000;

export const EMPTY_FORM: Omit<Task, "id" | "created_at" | "updated_at"> = {
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

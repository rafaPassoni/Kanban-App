export interface Task {
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

export interface Subtask {
    id?: number;
    task: number;
    title: string;
    is_done: boolean;
    order?: number;
    created_at?: string;
}

export interface Project {
    id: number;
    name: string;
}

export interface Collaborator {
    id: number;
    name: string;
}

export interface Department {
    id: number;
    name: string;
}

export type Modal =
    | { type: null }
    | { type: "add" }
    | { type: "edit"; id: number }
    | { type: "delete"; id: number; title?: string };

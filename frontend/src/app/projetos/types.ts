export interface Responsavel {
    id?: number;
    name: string;
    email: string;
    position: string;
    is_active?: boolean;
}

export interface Projeto {
    id?: number;
    name: string;
    description?: string;
    responsible_collaborators: number[];
    responsible_collaborators_names?: string[];
    used_by_departments: number[];
    used_by_departments_names?: string[];
    created_at?: string;
    updated_at?: string;
}

export interface Setor {
    id?: number;
    name: string;
    description?: string;
    department_type: "main" | "sub";
    is_active?: boolean;
}

export type ModalResp =
    | { type: null }
    | { type: "add" }
    | { type: "edit"; id: number }
    | { type: "delete"; id: number; name?: string }
    | { type: "view"; name: string; email: string; position: string };

export type ModalProj =
    | { type: null }
    | { type: "add" }
    | { type: "edit"; id: number }
    | { type: "delete"; id: number; name?: string }
    | { type: "view"; name: string; description: string };

export type ModalSetor =
    | { type: null }
    | { type: "add" }
    | { type: "edit"; id: number }
    | { type: "delete"; id: number; name?: string }
    | { type: "view"; name: string; description: string };

export const EMPTY_RESP: Responsavel = { name: "", email: "", position: "" };

export const EMPTY_PROJ: Omit<Projeto, "id" | "created_at" | "updated_at"> = {
    name: "",
    description: "",
    responsible_collaborators: [],
    used_by_departments: [],
};

export const EMPTY_SETOR: Pick<Setor, "name" | "description"> = { name: "", description: "" };

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import AuthService from "@/services/auth";
import { API_TASKS, API_PROJECTS, API_COLLABORATORS, API_DEPARTMENTS } from "@/constants/api";
import { extractResults } from "@/lib/api";
import type { Task, Project, Collaborator, Department } from "../types";
import { TASK_REFRESH_INTERVAL } from "../constants";

export function useKanbanData() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);

    const perms = { canAdd: true, canChange: true, canDelete: true };

    const authedFetch = useCallback((input: RequestInfo, init: RequestInit = {}) => {
        return AuthService.fetchWithAuth(input, init);
    }, []);

    const fetchData = useCallback(async (options?: { silent?: boolean }) => {
        try {
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
            setTasks(extractResults<Task>(tasksData));
            setProjects(extractResults<Project>(projectsData));
            setCollaborators(extractResults<Collaborator>(collabData));
            setDepartments(extractResults<Department>(deptData));
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

    const addTask = useCallback(
        async (payload: Omit<Task, "id" | "created_at" | "updated_at">) => {
            const res = await authedFetch(`${API_TASKS}/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                toast.error("Erro ao criar task.");
                return null;
            }
            const created = await res.json();
            setTasks((prev) => [...prev, created]);
            return created as Task;
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

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        let intervalId: number | null = null;
        const startPolling = () => {
            if (intervalId) return;
            intervalId = window.setInterval(() => {
                fetchData({ silent: true });
            }, TASK_REFRESH_INTERVAL);
        };
        const stopPolling = () => {
            if (intervalId) {
                window.clearInterval(intervalId);
                intervalId = null;
            }
        };
        const handleVisibility = () => {
            if (document.hidden) {
                stopPolling();
            } else {
                fetchData({ silent: true });
                startPolling();
            }
        };
        startPolling();
        document.addEventListener("visibilitychange", handleVisibility);
        return () => {
            stopPolling();
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [fetchData]);

    return {
        tasks, setTasks,
        projects, collaborators, departments,
        loading, perms,
        authedFetch, fetchData,
        addTask, updateTask, deleteTask,
    };
}

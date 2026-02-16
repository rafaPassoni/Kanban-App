"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Clock, User, Briefcase } from "lucide-react";
import styles from "./page.module.css";
import { API_TASKS_PUBLIC } from "@/constants/api";
import { parseISODateLocal } from "@/app/components/DateInputBRNative";

// ====================
// Tipos
// ====================
interface Task {
    id: number;
    title: string;
    description?: string;
    status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    project_name?: string;
    responsavel_name?: string;
    assigned_to_names?: string[];
    department_names?: string[];
    start_date?: string;
    deadline?: string;
    order: number;
    subtasks?: never;
}

// ====================
// Configuracao
// ====================
const AUTO_REFRESH_INTERVAL = 30000; // 30 segundos

const COLUMNS = [
    { id: "TODO", label: "A Fazer" },
    { id: "IN_PROGRESS", label: "Em Progresso" },
    { id: "IN_REVIEW", label: "Em Revisão" },
    { id: "DONE", label: "Concluído" },
] as const;

const PRIORITY_CONFIG = {
    LOW: { label: "Baixa", className: styles.priorityLow },
    MEDIUM: { label: "Média", className: styles.priorityMedium },
    HIGH: { label: "Alta", className: styles.priorityHigh },
    URGENT: { label: "Urgente", className: styles.priorityUrgent },
};

const COLUMN_STYLES = {
    TODO: {
        header: styles.columnHeaderTodo,
        title: styles.columnTitleTodo,
    },
    IN_PROGRESS: {
        header: styles.columnHeaderInProgress,
        title: styles.columnTitleInProgress,
    },
    IN_REVIEW: {
        header: styles.columnHeaderInReview,
        title: styles.columnTitleInReview,
    },
    DONE: {
        header: styles.columnHeaderDone,
        title: styles.columnTitleDone,
    },
} as const;

// ====================
// Pagina
// ====================
export default function KanbanTVPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [loading, setLoading] = useState(true);
    const [pageByColumn, setPageByColumn] = useState<Record<string, number>>({});

    // ====================
    // Buscar dados
    // ====================
    const fetchData = useCallback(async () => {
        try {
            const tasksRes = await fetch(API_TASKS_PUBLIC);

            if (tasksRes.ok) {
                const tasksData = await tasksRes.json();
                setTasks(Array.isArray(tasksData) ? tasksData : []);
            }

            setLastUpdate(new Date());
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // ====================
    // Atualizacao automatica
    // ====================
    useEffect(() => {
        fetchData();

        const interval = setInterval(() => {
            fetchData();
        }, AUTO_REFRESH_INTERVAL);

        return () => clearInterval(interval);
    }, [fetchData]);

    // ====================
    // Filtrar tarefas
    // ====================
    const getTasksByStatus = useCallback(
        (status: string) => {
            const priorityRank: Record<Task["priority"], number> = {
                URGENT: 0,
                HIGH: 1,
                MEDIUM: 2,
                LOW: 3,
            };

            const toDate = (value?: string) => {
                return parseISODateLocal(value);
            };

            const isLate = (value?: string) => {
                const d = toDate(value);
                if (!d) return false;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                d.setHours(0, 0, 0, 0);
                return d < today;
            };

            return tasks
                .filter((t) => t.status === status)
                .sort((a, b) => {
                    const prio = priorityRank[a.priority] - priorityRank[b.priority];
                    if (prio !== 0) return prio;

                    const overdue = Number(isLate(b.deadline)) - Number(isLate(a.deadline));
                    if (overdue !== 0) return overdue;

                    const da = toDate(a.deadline);
                    const db = toDate(b.deadline);
                    if (da && db) return da.getTime() - db.getTime();
                    if (da) return -1;
                    if (db) return 1;
                    return a.order - b.order;
                });
        },
        [tasks],
    );

    // ====================
    // Carrossel por coluna (TV)
    // ====================
    const CAROUSEL_PAGE_SIZE = 4;
    const CAROUSEL_INTERVAL_MS = 8000;

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setPageByColumn((prev) => {
                const next = { ...prev };

                COLUMNS.forEach((column) => {
                    const columnTasks = getTasksByStatus(column.id);
                    const totalPages = Math.max(1, Math.ceil(columnTasks.length / CAROUSEL_PAGE_SIZE));
                    const current = prev[column.id] ?? 0;
                    next[column.id] = (current + 1) % totalPages;
                });

                return next;
            });
        }, CAROUSEL_INTERVAL_MS);

        return () => window.clearInterval(intervalId);
    }, [getTasksByStatus, tasks.length]);

    // ====================
    // Indicadores
    // ====================
    const stats = {
        total: tasks.length,
        todo: getTasksByStatus("TODO").length,
        inProgress: getTasksByStatus("IN_PROGRESS").length,
        inReview: getTasksByStatus("IN_REVIEW").length,
        done: getTasksByStatus("DONE").length,
    };

    const isOverdue = useCallback((deadline?: string) => {
        if (!deadline) return false;
        const d = parseISODateLocal(deadline);
        if (!d) return false;
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
            <div className={styles.loadingPage}>
                <div className={styles.loadingCard}>
                    <div className={styles.loadingSpinner}></div>
                    <p className={styles.loadingText}>Carregando Kanban...</p>
                </div>
            </div>
        );
    }

    // ====================
    // Renderizacao
    // ====================
    return (
        <div className={styles.page}>
            {/* Cabecalho */}
            <div className={styles.header}>
                <div className={styles.headerRow}>
                    <div className={styles.headerLeft}>
                        <h1 className={styles.headerTitle}>Kanban Qualidade</h1>
                    </div>

                    <div className={styles.headerRight}>
                        <div className={styles.statsRow}>
                            <div className={styles.lastUpdate}>
                                <Clock className={styles.iconSm} />
                                <span>Última atualização: {lastUpdate.toLocaleTimeString()}</span>
                            </div>

                            <div className={styles.statsGrid}>
                                <div className={`${styles.statCard} ${styles.statNeutral}`}>
                                    <p className={styles.statValue}>{stats.todo}</p>
                                    <p className={styles.statLabel}>A Fazer</p>
                                </div>

                                <div className={`${styles.statCard} ${styles.statBlue}`}>
                                    <p className={`${styles.statValue} ${styles.statValueBlue}`}>{stats.inProgress}</p>
                                    <p className={`${styles.statLabel} ${styles.statLabelBlue}`}>Em Progresso</p>
                                </div>

                                <div className={`${styles.statCard} ${styles.statPurple}`}>
                                    <p className={`${styles.statValue} ${styles.statValuePurple}`}>{stats.inReview}</p>
                                    <p className={`${styles.statLabel} ${styles.statLabelPurple}`}>Em Revisão</p>
                                </div>

                                <div className={`${styles.statCard} ${styles.statEmerald}`}>
                                    <p className={`${styles.statValue} ${styles.statValueEmerald}`}>{stats.done}</p>
                                    <p className={`${styles.statLabel} ${styles.statLabelEmerald}`}>Concluído</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Kanban Board */}
            <div className={styles.boardHeader}>
                <div className={styles.autoRefresh}>
                    <div className={styles.autoRefreshRow}>
                        <div className={styles.pingWrapper}>
                            <span className={styles.ping}></span>
                            <span className={styles.pingDot}></span>
                        </div>
                        <span>Atualização automática ativa</span>
                    </div>
                </div>
            </div>
            <div className={styles.boardGrid}>
                {COLUMNS.map((column) => {
                    const columnTasks = getTasksByStatus(column.id);
                    const pageIndex = pageByColumn[column.id] ?? 0;
                    const start = pageIndex * CAROUSEL_PAGE_SIZE;
                    const pagedTasks = columnTasks.slice(start, start + CAROUSEL_PAGE_SIZE);
                    const columnStyle = COLUMN_STYLES[column.id];

                    return (
                        <div key={column.id} className={styles.column}>
                            {/* Cabecalho da coluna */}
                            <div className={`${styles.columnHeader} ${columnStyle.header}`}>
                                <h2 className={`${styles.columnTitle} ${columnStyle.title}`}>
                                    <span>{column.label}</span>
                                    <span className={styles.columnCount}>{columnTasks.length}</span>
                                </h2>
                            </div>

                            {/* Conteudo da coluna */}
                            <div className={styles.columnContent}>
                                {columnTasks.length === 0 ? (
                                    <div className={styles.emptyColumn}>
                                        <p>Nenhuma tarefa</p>
                                    </div>
                                ) : (
                                    pagedTasks.map((task) => {
                                        const priorityConfig = PRIORITY_CONFIG[task.priority];

                                        return (
                                            <div key={task.id} className={styles.taskCard}>
                                                {/* Cabecalho da task */}
                                                <div className={styles.taskHeader}>
                                                    <div className={styles.taskHeaderRow}>
                                                        <h3 className={styles.taskTitle}>{task.title}</h3>
                                                        <span
                                                            className={`${styles.priorityBadge} ${priorityConfig.className}`}
                                                        >
                                                            {priorityConfig.label}
                                                        </span>
                                                    </div>

                                                    {(task.deadline || task.status === "DONE") && (
                                                        <div className={styles.deadlineRow}>
                                                            {task.deadline && (
                                                                <>
                                                                    <span className={styles.deadlineLabel}>Prazo:</span>
                                                                    <span className={styles.deadlineValue}>
                                                                        {parseISODateLocal(task.deadline)?.toLocaleDateString("pt-BR")}
                                                                    </span>
                                                                </>
                                                            )}
                                                            {task.status === "DONE" && (
                                                                <span className={styles.deadlineDone}>CONCLUÍDO</span>
                                                            )}
                                                            {task.status !== "DONE" && task.deadline && isOverdue(task.deadline) && (
                                                                <span className={styles.deadlineOverdue}>Atrasado</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Task Body */}
                                                <div className={styles.taskBody}>
                                                    {/* Assigned To */}
                                                    {task.assigned_to_names && task.assigned_to_names.length > 0 && (
                                                        <div className={styles.assignedRow}>
                                                            <div className={styles.assignedIcon}>
                                                                <User className={styles.iconSmBlue} />
                                                            </div>
                                                            <div className={styles.assignedInfo}>
                                                                <p className={styles.assignedName}>
                                                                    {task.assigned_to_names.join(", ")}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Responsável */}
                                                    {task.responsavel_name && (
                                                        <div className={styles.metaRow}>
                                                            <User className={styles.iconXs} />
                                                            <span className={styles.metaText}>{task.responsavel_name}</span>
                                                        </div>
                                                    )}

                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
}


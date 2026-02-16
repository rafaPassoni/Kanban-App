"use client";
import React, { useCallback, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "@/app/components/Navbar";
import { parseISODateLocal } from "@/app/components/DateInputBRNative";
import { Kanban as KanbanFill } from "lucide-react";
import ErrorBoundary from "@/app/components/ErrorBoundary";
import type { Task, Modal } from "./types";
import { COLUMNS } from "./constants";
import { useKanbanData } from "./hooks/useKanbanData";
import { useKanbanFilters } from "./hooks/useKanbanFilters";
import { useSubtasks } from "./hooks/useSubtasks";
import { SubtaskProvider } from "./contexts/SubtaskContext";
import KanbanFilterBar from "./components/KanbanFilterBar";
import KanbanColumn from "./components/KanbanColumn";
import TaskCard from "./components/TaskCard";
import TaskModals from "./components/TaskModals";

// ====================
// Página
// ====================
export default function KanbanPage() {
    const {
        tasks, setTasks,
        projects, collaborators, departments,
        loading, perms,
        authedFetch,
        addTask, updateTask, deleteTask,
    } = useKanbanData();

    const {
        filterProject, setFilterProject,
        filterAssignedTo, setFilterAssignedTo,
        filterDepartment, setFilterDepartment,
        filteredTasks,
    } = useKanbanFilters(tasks);

    const subtaskHook = useSubtasks(tasks, setTasks, authedFetch);

    // -------- UI State
    const [modal, setModal] = useState<Modal>({ type: null });
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
    const [descriptionTasks, setDescriptionTasks] = useState<Set<number>>(new Set());
    const [collapsedColumns, setCollapsedColumns] = useState<Set<Task["status"]>>(new Set());
    const [reopenModal, setReopenModal] = useState<{
        open: boolean; taskId: number | null; nextStatus: Task["status"] | null;
    }>({ open: false, taskId: null, nextStatus: null });
    const [doneModal, setDoneModal] = useState<{
        open: boolean; taskId: number | null; solution: string;
    }>({ open: false, taskId: null, solution: "" });
    const [solutionModal, setSolutionModal] = useState<{
        open: boolean; taskId: number | null; solution: string;
    }>({ open: false, taskId: null, solution: "" });

    // -------- Handlers
    const toggleTaskExpanded = useCallback((taskId: number) => {
        setExpandedTasks((prev) => {
            const next = new Set(prev);
            next.has(taskId) ? next.delete(taskId) : next.add(taskId);
            return next;
        });
    }, []);

    const toggleTaskDescription = useCallback((taskId: number) => {
        setDescriptionTasks((prev) => {
            const next = new Set(prev);
            next.has(taskId) ? next.delete(taskId) : next.add(taskId);
            return next;
        });
    }, []);

    const toggleColumnCollapsed = useCallback((status: Task["status"]) => {
        setCollapsedColumns((prev) => {
            const next = new Set(prev);
            next.has(status) ? next.delete(status) : next.add(status);
            return next;
        });
    }, []);

    // -------- Drag & Drop (tasks)
    const handleDragStart = (e: React.DragEvent, task: Task) => {
        if (!perms.canChange) return;
        e.dataTransfer.effectAllowed = "move";
        setDraggedTask(task);
    };

    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

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

    // -------- Sorting
    const getTasksByStatus = (status: Task["status"]) => {
        const priorityRank: Record<Task["priority"], number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        const toDate = (value?: string | null) => parseISODateLocal(value);
        const getDoneDate = (task: Task) =>
            toDate(task.completed_at) || toDate(task.updated_at) || toDate(task.created_at) || null;
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

    // -------- Loading skeleton
    if (loading) {
        return (
            <>
                <Navbar />
                <ToastContainer position="bottom-right" />
                <div className="min-h-[calc(100dvh-120px)] overflow-hidden text-slate-100 px-4 pb-4 pt-0">
                    <div className="w-full max-w-8xl mx-auto">
                        <div className="-mt-5 flex flex-col sm:flex-row sm:flex-wrap gap-4">
                            {COLUMNS.map((column) => (
                                <div
                                    key={column.id}
                                    className="bg-slate-800/50 rounded-xl border border-slate-700/50 flex flex-col h-auto sm:h-[calc(100vh-170px)] flex-1 min-w-full sm:min-w-70 pt-2 px-3 sm:px-4 pb-4"
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

    // -------- Render
    return (
        <>
            <Navbar />
            <ToastContainer position="bottom-right" />
            <div className="min-h-[calc(100dvh-120px)] overflow-hidden text-slate-100 px-4 pb-4 pt-0">
                <div className="w-full max-w-8xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-3">
                            <KanbanFill className="h-8 w-8 text-emerald-400" />
                            <div className="flex flex-col">
                                <h1 className="text-2xl font-semibold text-slate-50">Kanban Qualidade</h1>
                            </div>
                        </div>
                        <KanbanFilterBar
                            projects={projects}
                            collaborators={collaborators}
                            departments={departments}
                            filterProject={filterProject}
                            setFilterProject={setFilterProject}
                            filterAssignedTo={filterAssignedTo}
                            setFilterAssignedTo={setFilterAssignedTo}
                            filterDepartment={filterDepartment}
                            setFilterDepartment={setFilterDepartment}
                            canAdd={perms.canAdd}
                            onAddTask={() => setModal({ type: "add" })}
                        />
                    </div>

                    {/* Kanban Board */}
                    <ErrorBoundary>
                    <SubtaskProvider value={subtaskHook}>
                        <div className="-mt-5 flex flex-col sm:flex-row sm:flex-wrap gap-4">
                            {COLUMNS.map((column) => {
                                const columnTasks = getTasksByStatus(column.id);
                                const isCollapsed = collapsedColumns.has(column.id);
                                return (
                                    <KanbanColumn
                                        key={column.id}
                                        column={column}
                                        tasks={columnTasks}
                                        isCollapsed={isCollapsed}
                                        onToggleCollapse={() => toggleColumnCollapsed(column.id)}
                                        onDragOver={handleDragOver}
                                        onDrop={() => handleDrop(column.id)}
                                    >
                                        {columnTasks.length === 0 ? (
                                            <div className="flex-1 min-h-50 overflow-y-auto pr-1 flex items-center justify-center">
                                                <div className="text-center py-8 text-slate-500 text-sm">Nenhuma Task</div>
                                            </div>
                                        ) : (
                                            <div className="flex-1 min-h-50 overflow-y-auto">
                                                <div className="-space-y-2">
                                                    {columnTasks.map((task) => (
                                                        <div key={task.id}>
                                                            <TaskCard
                                                                task={task}
                                                                perms={{ canChange: perms.canChange, canDelete: perms.canDelete }}
                                                                collaborators={collaborators}
                                                                departments={departments}
                                                                isExpanded={expandedTasks.has(task.id || 0)}
                                                                isDescriptionExpanded={descriptionTasks.has(task.id || 0)}
                                                                onToggleExpanded={() => toggleTaskExpanded(task.id || 0)}
                                                                onToggleDescription={() => toggleTaskDescription(task.id || 0)}
                                                                onEdit={() => {
                                                                    if (task.id) setModal({ type: "edit", id: task.id });
                                                                }}
                                                                onDelete={() => {
                                                                    if (task.id) setModal({ type: "delete", id: task.id, title: task.title });
                                                                }}
                                                                onDragStart={(e) => handleDragStart(e, task)}
                                                                onViewSolution={() => {
                                                                    setSolutionModal({
                                                                        open: true,
                                                                        taskId: task.id || 0,
                                                                        solution: task.solution || "",
                                                                    });
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </KanbanColumn>
                                );
                            })}
                        </div>
                    </SubtaskProvider>
                    </ErrorBoundary>
                </div>
            </div>

            <TaskModals
                modal={modal}
                setModal={setModal}
                tasks={tasks}
                projects={projects}
                collaborators={collaborators}
                departments={departments}
                addTask={addTask}
                updateTask={updateTask}
                deleteTask={deleteTask}
                reopenModal={reopenModal}
                setReopenModal={setReopenModal}
                doneModal={doneModal}
                setDoneModal={setDoneModal}
                solutionModal={solutionModal}
                setSolutionModal={setSolutionModal}
            />
        </>
    );
}

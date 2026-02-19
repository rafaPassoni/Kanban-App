"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Tv, ChevronDown } from "lucide-react";
import type { Project, Collaborator, Department } from "../types";

interface KanbanFilterBarProps {
    projects: Project[];
    collaborators: Collaborator[];
    departments: Department[];
    filterProject: string;
    setFilterProject: (v: string) => void;
    filterAssignedTo: string;
    setFilterAssignedTo: (v: string) => void;
    filterDepartment: string;
    setFilterDepartment: (v: string) => void;
    canAdd: boolean;
    onAddTask: () => void;
}

export default function KanbanFilterBar({
    projects, collaborators, departments,
    filterProject, setFilterProject,
    filterAssignedTo, setFilterAssignedTo,
    filterDepartment, setFilterDepartment,
    canAdd, onAddTask,
}: KanbanFilterBarProps) {
    const [isProjectOpen, setIsProjectOpen] = useState(false);
    const [isAssignedOpen, setIsAssignedOpen] = useState(false);
    const [isDepartmentOpen, setIsDepartmentOpen] = useState(false);
    const [, setProjectTypeahead] = useState("");
    const [, setAssignedTypeahead] = useState("");
    const [, setDepartmentTypeahead] = useState("");

    const projectDropdownRef = useRef<HTMLDivElement | null>(null);
    const assignedDropdownRef = useRef<HTMLDivElement | null>(null);
    const departmentDropdownRef = useRef<HTMLDivElement | null>(null);
    const projectListRef = useRef<HTMLUListElement | null>(null);
    const assignedListRef = useRef<HTMLUListElement | null>(null);
    const departmentListRef = useRef<HTMLUListElement | null>(null);
    const projectTypeaheadTimer = useRef<number | null>(null);
    const assignedTypeaheadTimer = useRef<number | null>(null);
    const departmentTypeaheadTimer = useRef<number | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) setIsProjectOpen(false);
            if (assignedDropdownRef.current && !assignedDropdownRef.current.contains(event.target as Node)) setIsAssignedOpen(false);
            if (departmentDropdownRef.current && !departmentDropdownRef.current.contains(event.target as Node)) setIsDepartmentOpen(false);
        };
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            setIsProjectOpen(false);
            setIsAssignedOpen(false);
            setIsDepartmentOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    useEffect(() => {
        if (!isProjectOpen) { setProjectTypeahead(""); return; }
        const handle = setTimeout(() => projectDropdownRef.current?.focus(), 0);
        return () => clearTimeout(handle);
    }, [isProjectOpen]);

    useEffect(() => {
        if (!isAssignedOpen) { setAssignedTypeahead(""); return; }
        const handle = setTimeout(() => assignedDropdownRef.current?.focus(), 0);
        return () => clearTimeout(handle);
    }, [isAssignedOpen]);

    useEffect(() => {
        if (!isDepartmentOpen) { setDepartmentTypeahead(""); return; }
        const handle = setTimeout(() => departmentDropdownRef.current?.focus(), 0);
        return () => clearTimeout(handle);
    }, [isDepartmentOpen]);

    const handleTypeaheadSelect = useCallback(
        (
            event: React.KeyboardEvent,
            options: { value: string; label: string }[],
            setBuffer: React.Dispatch<React.SetStateAction<string>>,
            setFilter: (value: string) => void,
            timerRef: React.MutableRefObject<number | null>,
            listRef: React.RefObject<HTMLUListElement | null>,
        ) => {
            if (event.key === "Escape" || event.key === "Enter" || event.key === "ArrowDown" || event.key === "ArrowUp") return;
            if (event.key.length !== 1) return;
            if (timerRef.current) window.clearTimeout(timerRef.current);
            setBuffer((prev) => {
                const next = (prev + event.key).toLowerCase();
                const match = options.find((opt) => opt.label.toLowerCase().startsWith(next));
                if (match) {
                    setFilter(match.value);
                    const el = listRef.current?.querySelector<HTMLButtonElement>(`[data-option-value="${match.value}"]`);
                    el?.scrollIntoView({ block: "nearest" });
                    event.preventDefault();
                }
                timerRef.current = window.setTimeout(() => setBuffer(""), 700);
                return next;
            });
        },
        [],
    );

    const btnClass = "peer w-full truncate rounded-xl border border-slate-700/80 bg-gradient-to-b from-slate-900/95 to-slate-900/80 py-2.5 pl-3 pr-9 text-left text-sm font-normal text-slate-100 shadow-sm shadow-slate-950/30 transition-all duration-150 cursor-pointer hover:border-blue-500/80 hover:shadow-blue-900/20 focus:outline-none focus:ring-0 focus:border-blue-500/80 focus:shadow-blue-900/20 focus-visible:outline-none focus-visible:ring-0";
    const dropdownClass = "absolute z-30 mt-0.5 w-full overflow-hidden rounded-xl border border-slate-600/90 bg-slate-900/95 shadow-xl shadow-black/40 backdrop-blur-sm";

    const renderOption = (value: string, label: string, currentFilter: string, setFilter: (v: string) => void, setOpen: (v: boolean) => void) => (
        <li key={value}>
            <button
                type="button"
                onClick={() => { setFilter(value); setOpen(false); }}
                data-option-value={value}
                className={`w-full px-3 py-2 text-left text-sm font-normal transition-colors cursor-pointer ${
                    currentFilter === value ? "bg-blue-600/80 text-white" : "text-slate-100 hover:bg-slate-700/80"
                }`}
            >
                {label}
            </button>
        </li>
    );

    return (
        <div className="grid grid-cols-3 gap-x-2 gap-y-3 w-full lg:flex lg:flex-wrap lg:items-center lg:gap-2 lg:w-auto lg:ml-auto">
            {/* Filtro Projetos */}
            <div className="flex items-center gap-2 relative min-w-0">
                <label className="hidden lg:inline text-sm text-slate-300 shrink-0">Projetos:</label>
                <div
                    ref={projectDropdownRef}
                    className="group relative w-full lg:min-w-45 outline-none focus:outline-none focus-visible:outline-none"
                    tabIndex={-1}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") { setIsProjectOpen(false); return; }
                        if (!isProjectOpen) return;
                        handleTypeaheadSelect(
                            event,
                            [{ value: "all", label: "Todos" }, ...projects.map((p) => ({ value: String(p.id), label: p.name }))],
                            setProjectTypeahead, setFilterProject, projectTypeaheadTimer, projectListRef,
                        );
                    }}
                >
                    <button type="button" onClick={() => setIsProjectOpen((prev) => !prev)} className={btnClass} aria-haspopup="listbox" aria-expanded={isProjectOpen}>
                        {filterProject === "all" ? "Todos" : projects.find((p) => String(p.id) === filterProject)?.name || "Todos"}
                    </button>
                    <span className="dropdown-chevron">
                        <ChevronDown className={`h-4 w-4 transition-transform duration-150 ${isProjectOpen ? "rotate-180" : ""}`} />
                    </span>
                    {isProjectOpen && (
                        <div className={dropdownClass}>
                            <ul ref={projectListRef} className="max-h-60 overflow-y-auto py-1" role="listbox">
                                {renderOption("all", "Todos", filterProject, setFilterProject, setIsProjectOpen)}
                                {projects.map((p) => renderOption(String(p.id), p.name, filterProject, setFilterProject, setIsProjectOpen))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Filtro Responsáveis */}
            <div className="flex items-center gap-2 relative min-w-0 lg:ml-1">
                <label className="hidden lg:inline text-sm text-slate-300 shrink-0">Responsáveis:</label>
                <div
                    ref={assignedDropdownRef}
                    className="group relative w-full lg:min-w-45 outline-none focus:outline-none focus-visible:outline-none"
                    tabIndex={-1}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") { setIsAssignedOpen(false); return; }
                        if (!isAssignedOpen) return;
                        handleTypeaheadSelect(
                            event,
                            [{ value: "all", label: "Todos" }, ...collaborators.map((c) => ({ value: String(c.id), label: c.name }))],
                            setAssignedTypeahead, setFilterAssignedTo, assignedTypeaheadTimer, assignedListRef,
                        );
                    }}
                >
                    <button type="button" onClick={() => setIsAssignedOpen((prev) => !prev)} className={btnClass} aria-haspopup="listbox" aria-expanded={isAssignedOpen}>
                        {filterAssignedTo === "all" ? "Todos" : collaborators.find((c) => String(c.id) === filterAssignedTo)?.name || "Todos"}
                    </button>
                    <span className="dropdown-chevron">
                        <ChevronDown className={`h-4 w-4 transition-transform duration-150 ${isAssignedOpen ? "rotate-180" : ""}`} />
                    </span>
                    {isAssignedOpen && (
                        <div className={dropdownClass}>
                            <ul ref={assignedListRef} className="max-h-60 overflow-y-auto py-1" role="listbox">
                                {renderOption("all", "Todos", filterAssignedTo, setFilterAssignedTo, setIsAssignedOpen)}
                                {collaborators.map((c) => renderOption(String(c.id), c.name, filterAssignedTo, setFilterAssignedTo, setIsAssignedOpen))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Filtro Departamentos */}
            <div className="flex items-center gap-2 relative min-w-0 lg:ml-1">
                <label className="hidden lg:inline text-sm text-slate-300 shrink-0">Setor:</label>
                <div
                    ref={departmentDropdownRef}
                    className="group relative w-full lg:min-w-45 outline-none focus:outline-none focus-visible:outline-none"
                    tabIndex={-1}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") { setIsDepartmentOpen(false); return; }
                        if (!isDepartmentOpen) return;
                        handleTypeaheadSelect(
                            event,
                            [{ value: "all", label: "Todos" }, ...departments.map((d) => ({ value: String(d.id), label: d.name }))],
                            setDepartmentTypeahead, setFilterDepartment, departmentTypeaheadTimer, departmentListRef,
                        );
                    }}
                >
                    <button type="button" onClick={() => setIsDepartmentOpen((prev) => !prev)} className={btnClass} aria-haspopup="listbox" aria-expanded={isDepartmentOpen}>
                        {filterDepartment === "all" ? "Todos" : departments.find((d) => String(d.id) === filterDepartment)?.name || "Todos"}
                    </button>
                    <span className="dropdown-chevron">
                        <ChevronDown className={`h-4 w-4 transition-transform duration-150 ${isDepartmentOpen ? "rotate-180" : ""}`} />
                    </span>
                    {isDepartmentOpen && (
                        <div className={dropdownClass}>
                            <ul ref={departmentListRef} className="max-h-60 overflow-y-auto py-1" role="listbox">
                                {renderOption("all", "Todos", filterDepartment, setFilterDepartment, setIsDepartmentOpen)}
                                {departments.map((d) => renderOption(String(d.id), d.name, filterDepartment, setFilterDepartment, setIsDepartmentOpen))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            <div className="col-span-3 flex items-center gap-2 lg:col-span-1 lg:ml-1">
                <a
                    href="/kanban/tv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 lg:flex-none items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-purple-500/70 bg-purple-600 hover:bg-purple-700 text-[15px] font-medium text-white cursor-pointer shadow-sm shadow-purple-900/40 transition-colors"
                    title="Abrir versão para TV"
                >
                    <Tv className="h-5.5 w-5.5" />
                </a>
                {canAdd && (
                    <button
                        onClick={onAddTask}
                        className="inline-flex flex-1 lg:flex-none items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-blue-500/70 bg-blue-600 hover:bg-blue-700 text-[15px] font-medium text-white cursor-pointer shadow-sm shadow-blue-900/40 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden lg:inline">Nova Task</span>
                    </button>
                )}
            </div>
        </div>
    );
}

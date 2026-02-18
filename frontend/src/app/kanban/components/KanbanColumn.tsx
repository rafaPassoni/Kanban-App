"use client";
import React from "react";
import { ChevronDown } from "lucide-react";
import type { Task } from "../types";
import { COLUMNS } from "../constants";

interface KanbanColumnProps {
    column: typeof COLUMNS[number];
    tasks: Task[];
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: () => void;
    children: React.ReactNode;
}

export default function KanbanColumn({
    column, tasks, isCollapsed, onToggleCollapse, onDragOver, onDrop, children,
}: KanbanColumnProps) {
    const Icon = column.icon;
    return (
        <div
            className={[
                "bg-slate-800/50 rounded-xl border border-slate-700/50 flex flex-col h-auto sm:h-[calc(100dvh-170px)] transition-all",
                isCollapsed
                    ? "p-2 sm:w-14 sm:items-center"
                    : "flex-1 min-w-full sm:min-w-70 pt-2 px-3 sm:px-4 pb-4",
            ].join(" ")}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            <div className={isCollapsed
                ? "flex items-center justify-between sm:flex-col sm:items-center sm:gap-2"
                : "flex items-center justify-between mb-2"
            }>
                {/* Icon + title + count: always visible when expanded; on mobile also visible when collapsed */}
                <div className={`flex items-center gap-2 ${isCollapsed ? "sm:hidden" : ""}`}>
                    <Icon
                        className={
                            column.id === "IN_REVIEW"
                                ? "h-5 w-5 text-yellow-400"
                                : `h-5 w-5 text-${column.color}-400`
                        }
                    />
                    <h2 className="font-semibold text-slate-200">{column.title}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-${column.color}-900/40 border border-${column.color}-600/40 text-${column.color}-300`}>
                        {tasks.length}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onToggleCollapse}
                    className="rounded-full border border-slate-600/70 bg-slate-900/70 text-slate-200 hover:text-blue-300 hover:border-blue-500/70 transition-colors w-10 h-10 sm:w-7 sm:h-7 flex items-center justify-center cursor-pointer"
                    title={isCollapsed ? "Expandir coluna" : "Recolher coluna"}
                >
                    {/* Mobile: up/down chevron (vertical collapse). Desktop: left/right (horizontal collapse) */}
                    <ChevronDown className={`h-4 w-4 sm:h-3 sm:w-3 transition-transform ${
                        isCollapsed ? "sm:-rotate-90" : "rotate-180 sm:rotate-90"
                    }`} />
                </button>
                {/* Desktop collapsed: vertical text + count */}
                {isCollapsed && (
                    <>
                        <div className={`hidden sm:block font-semibold uppercase tracking-wide text-lg text-${column.color}-300`}>
                            {tasks.length}
                        </div>
                        <div
                            className={`hidden sm:block font-semibold text-base text-${column.color}-200`}
                            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                        >
                            {column.title}
                        </div>
                    </>
                )}
            </div>
            {!isCollapsed && children}
        </div>
    );
}

"use client";
import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";

interface MultiSelectDropdownProps {
    label: string;
    items: { id: number; name: string }[];
    selectedIds: number[];
    onChange: (ids: number[]) => void;
}

export default function MultiSelectDropdown({ label, items, selectedIds, onChange }: MultiSelectDropdownProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
            <div ref={ref} className="relative">
                <button
                    type="button"
                    onClick={() => setOpen(!open)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                >
                    <span className={selectedIds.length > 0 ? "text-white" : "text-slate-400"}>
                        {selectedIds.length > 0
                            ? `${selectedIds.length} setor${selectedIds.length > 1 ? "es" : ""} selecionado${selectedIds.length > 1 ? "s" : ""}`
                            : "Selecione..."}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>

                {open && (
                    <div className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {items.map((item) => {
                            const checked = selectedIds.includes(item.id);
                            return (
                                <label
                                    key={item.id}
                                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/50 cursor-pointer transition-colors text-sm"
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => {
                                            onChange(
                                                checked
                                                    ? selectedIds.filter((id) => id !== item.id)
                                                    : [...selectedIds, item.id],
                                            );
                                        }}
                                        className="accent-blue-500 h-4 w-4 rounded"
                                    />
                                    <span className={checked ? "text-blue-300" : "text-slate-300"}>{item.name}</span>
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>

            {selectedIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedIds.map((id) => {
                        const item = items.find((i) => i.id === id);
                        if (!item) return null;
                        return (
                            <span
                                key={id}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-blue-600/20 text-blue-300 border border-blue-500/40"
                            >
                                {item.name}
                                <button
                                    type="button"
                                    onClick={() => onChange(selectedIds.filter((d) => d !== id))}
                                    className="hover:text-white transition-colors cursor-pointer"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

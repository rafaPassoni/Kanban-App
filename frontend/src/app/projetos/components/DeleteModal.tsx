"use client";
import React from "react";

interface DeleteModalProps {
    title: string;
    itemName?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function DeleteModal({ title, itemName, onConfirm, onCancel }: DeleteModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl border border-slate-700/80 bg-slate-900 p-6 shadow-2xl">
                <h3 className="text-lg font-semibold text-slate-100 mb-3">Confirmar exclusão</h3>
                <p className="text-sm text-slate-400 mb-6">
                    Tem certeza que deseja excluir {title} <strong className="text-slate-200">{itemName}</strong>?
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-500 transition-colors cursor-pointer"
                    >
                        Excluir
                    </button>
                </div>
            </div>
        </div>
    );
}

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
        <div className="modal-overlay">
            <div className="w-full max-w-sm rounded-2xl border border-slate-700/80 bg-slate-900 p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold text-slate-100 mb-3">Confirmar exclusão</h3>
                <p className="text-sm text-slate-400 mb-6">
                    Tem certeza que deseja excluir {title} <strong className="text-slate-200">{itemName}</strong>?
                </p>
                <div className="flex flex-wrap justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn-cancel"
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

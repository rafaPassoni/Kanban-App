"use client";
import React, { Component } from "react";

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;
            return (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="rounded-xl border border-red-700/50 bg-red-950/30 p-8 max-w-md">
                        <h2 className="text-lg font-semibold text-red-300 mb-2">Algo deu errado</h2>
                        <p className="text-sm text-slate-400 mb-4">
                            Ocorreu um erro inesperado. Tente recarregar a página.
                        </p>
                        <button
                            type="button"
                            onClick={() => this.setState({ hasError: false, error: null })}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer"
                        >
                            Tentar novamente
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

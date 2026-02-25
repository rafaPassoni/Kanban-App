"use client";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
            <div className="rounded-2xl border border-red-700/50 bg-red-950/30 p-10 shadow-xl max-w-md">
                <h2 className="text-lg font-semibold text-red-300">
                    Algo deu errado
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                    Ocorreu um erro inesperado. Tente recarregar a pagina.
                </p>
                {error.digest && (
                    <p className="mt-2 text-xs text-slate-500">
                        Codigo: {error.digest}
                    </p>
                )}
                <button
                    type="button"
                    onClick={reset}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-500 cursor-pointer"
                >
                    Tentar novamente
                </button>
            </div>
        </div>
    );
}

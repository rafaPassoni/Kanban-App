import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/80 p-10 shadow-xl shadow-slate-950/50 backdrop-blur max-w-md">
                <h1 className="text-6xl font-bold text-slate-300">404</h1>
                <h2 className="mt-4 text-lg font-semibold text-slate-200">
                    Pagina nao encontrada
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                    A pagina que voce procura nao existe ou foi movida.
                </p>
                <Link
                    href="/kanban"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-500"
                >
                    Voltar ao Kanban
                </Link>
            </div>
        </div>
    );
}

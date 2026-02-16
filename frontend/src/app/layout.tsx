import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
    title: "Kanban Qualidade",
    description: "Gestão de projetos de qualidade",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <body className="antialiased min-h-screen bg-slate-950 text-slate-50 selection:bg-blue-500/30 selection:text-blue-100">
                <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1e293b,#020617)]">
                    <Providers>{children}</Providers>
                </div>
            </body>
        </html>
    );
}

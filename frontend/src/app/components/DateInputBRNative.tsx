"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

// ====================
// Funcoes auxiliares de data (padrao BR)
// ====================
export function isoToBR(iso?: string) {
    if (!iso) return "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
}
export function brToISO(br?: string) {
    if (!br) return "";
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(br)) return "";
    const [ddStr, mmStr, yyyyStr] = br.split("/");
    const dd = Number(ddStr);
    const mm = Number(mmStr);
    const yyyy = Number(yyyyStr);
    if (!dd || !mm || !yyyy) return "";
    if (mm < 1 || mm > 12) return "";
    if (dd < 1 || dd > 31) return "";
    const iso = `${String(yyyy).padStart(4, "0")}-${String(mm).padStart(2, "0")}-${String(dd).padStart(
        2,
        "0",
    )}`;
    const dt = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(dt.getTime())) return "";
    const check = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
        dt.getDate(),
    ).padStart(2, "0")}`;
    if (check !== iso) return "";
    return iso;
}
export function formatDigitsToBR(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    const d = digits.slice(0, 2);
    const m = digits.slice(2, 4);
    const y = digits.slice(4, 8);
    if (digits.length <= 2) return d;
    if (digits.length <= 4) return `${d}/${m}`;
    return `${d}/${m}/${y}`;
}
export function validateBRDatePartial(value: string): { valid: boolean; reason?: string } {
    if (!value) return { valid: true };
    if (!/^[\d/]*$/.test(value)) return { valid: false, reason: "Use apenas números." };

    const parts = value.split("/");
    const [ddStr = "", mmStr = "", yyyyStr = ""] = parts;

    if (ddStr.length > 2 || mmStr.length > 2 || yyyyStr.length > 4) {
        return { valid: false, reason: "Formato inválido (DD/MM/AAAA)." };
    }

    if (ddStr.length === 2) {
        const dd = Number(ddStr);
        if (dd < 1 || dd > 31) return { valid: false, reason: "Dia deve ser entre 01 e 31." };
    }
    if (mmStr.length === 2) {
        const mm = Number(mmStr);
        if (mm < 1 || mm > 12) return { valid: false, reason: "Mês deve ser entre 01 e 12." };
    }

    if (ddStr.length === 2 && mmStr.length === 2) {
        const dd = Number(ddStr);
        const mm = Number(mmStr);
        const yyyy = yyyyStr.length === 4 ? Number(yyyyStr) : 2000;
        const maxDays = new Date(yyyy, mm, 0).getDate();
        if (dd > maxDays) {
            return { valid: false, reason: "Dia inválido para o mês informado." };
        }
    }

    return { valid: true };
}
export function parseISODateLocal(value?: string | null) {
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m, d] = value.split("-").map(Number);
        if (!y || !m || !d) return null;
        return new Date(y, m - 1, d);
    }
    const dt = new Date(value);
    return Number.isNaN(dt.getTime()) ? null : dt;
}

export type DateInputBRNativeProps = {
    label: string;
    valueISO: string;
    onChangeISO: (nextISO: string) => void;
    required?: boolean;
};

export default function DateInputBRNative({ label, valueISO, onChangeISO, required }: DateInputBRNativeProps) {
    const [text, setText] = useState(() => isoToBR(valueISO));
    const [inputError, setInputError] = useState<string>("");
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const [viewDate, setViewDate] = useState<Date>(() => parseISODateLocal(valueISO) || new Date());
    useEffect(() => {
        setText(isoToBR(valueISO));
    }, [valueISO]);
    useEffect(() => {
        const parsed = parseISODateLocal(valueISO);
        if (parsed) setViewDate(parsed);
    }, [valueISO]);
    useEffect(() => {
        if (!isCalendarOpen) return;
        const onPointerDown = (ev: PointerEvent) => {
            const root = containerRef.current;
            if (!root) return;
            if (root.contains(ev.target as Node)) return;
            setIsCalendarOpen(false);
        };
        const onKeyDown = (ev: KeyboardEvent) => {
            if (ev.key === "Escape") {
                setIsCalendarOpen(false);
                buttonRef.current?.focus();
            }
        };
        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [isCalendarOpen]);
    const isInvalid = useMemo(() => {
        if (inputError) return true;
        if (!text) return false;
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(text)) return false;
        return !brToISO(text);
    }, [inputError, text]);
    const helperMessage = useMemo(() => {
        if (inputError) return inputError;
        if (!text) return "";
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(text)) return "";
        return brToISO(text) ? "" : "Data inválida.";
    }, [inputError, text]);
    const weekdays = useMemo(() => ["D", "S", "T", "Q", "Q", "S", "S"], []);
    const monthLabel = useMemo(
        () => viewDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
        [viewDate],
    );
    const selectedDate = useMemo(() => parseISODateLocal(valueISO), [valueISO]);
    const selectedISO = useMemo(() => {
        if (!selectedDate) return "";
        return `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(
            selectedDate.getDate(),
        ).padStart(2, "0")}`;
    }, [selectedDate]);
    const calendarDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstOfMonth = new Date(year, month, 1);
        const startWeekday = firstOfMonth.getDay();
        const gridStart = new Date(year, month, 1 - startWeekday);
        const days: { date: Date; iso: string; isCurrentMonth: boolean }[] = [];
        for (let i = 0; i < 42; i += 1) {
            const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
            const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
                d.getDate(),
            ).padStart(2, "0")}`;
            days.push({ date: d, iso, isCurrentMonth: d.getMonth() === month });
        }
        return days;
    }, [viewDate]);
    const todayISO = useMemo(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(
            2,
            "0",
        )}`;
    }, []);
    const goToMonth = useCallback((delta: number) => {
        setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    }, []);
    const selectISOFromCalendar = useCallback(
        (iso: string) => {
            onChangeISO(iso);
            setText(isoToBR(iso));
            setInputError("");
            setIsCalendarOpen(false);
        },
        [onChangeISO],
    );
    return (
        <div className="space-y-1" ref={containerRef}>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
            <div className="relative flex items-start gap-2">
                <input
                    value={text}
                    onChange={(e) => {
                        const inputType = (e.nativeEvent as InputEvent | undefined)?.inputType || "";
                        const isDeletion = inputType.startsWith("delete") || e.target.value.length < text.length;

                        const nextText = isDeletion ? e.target.value : formatDigitsToBR(e.target.value);

                        const validation = validateBRDatePartial(nextText);
                        if (!validation.valid) {
                            setInputError(validation.reason || "Data inválida.");
                            return;
                        }

                        if (inputError) setInputError("");
                        setText(nextText);
                        const iso = brToISO(nextText);
                        if (iso) onChangeISO(iso);
                    }}
                    onBlur={() => {
                        const iso = brToISO(text);
                        if (iso) {
                            setInputError("");
                            onChangeISO(iso);
                            setText(isoToBR(iso));
                            const parsed = parseISODateLocal(iso);
                            if (parsed) setViewDate(parsed);
                        } else {
                            if (text) setInputError("Data inválida.");
                            onChangeISO("");
                        }
                    }}
                    inputMode="numeric"
                    placeholder="DD/MM/AAAA"
                    className={[
                        "w-full px-3 py-2.5 bg-slate-900 border rounded-xl focus:outline-none focus:ring-2 text-white",
                        isInvalid
                            ? "border-red-500/80 focus:ring-red-500"
                            : "border-slate-700 focus:ring-blue-500 focus:border-transparent",
                    ].join(" ")}
                    required={required}
                />

                <button
                    ref={buttonRef}
                    type="button"
                    onClick={() => {
                        const parsed = parseISODateLocal(valueISO);
                        setViewDate(parsed || new Date());
                        setIsCalendarOpen((prev) => !prev);
                    }}
                    className={[
                        "rounded-xl px-3 py-2.5 border text-white transition-colors cursor-pointer",
                        isCalendarOpen
                            ? "bg-blue-600/20 border-blue-500/60"
                            : "bg-slate-800 hover:bg-slate-700 border-slate-600",
                    ].join(" ")}
                    title="Abrir calendário"
                    aria-expanded={isCalendarOpen}
                    aria-haspopup="dialog"
                >
                    <Calendar className="h-4 w-4" />
                </button>

                {isCalendarOpen && (
                    <div
                        className="absolute bottom-full right-0 mb-2 w-[280px] rounded-xl border border-slate-700/80 bg-slate-900/95 shadow-2xl shadow-black/40 p-3"
                        role="dialog"
                        aria-label="Calendário"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <button
                                type="button"
                                onClick={() => goToMonth(-1)}
                                className="p-1.5 rounded-md border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-800 transition-colors"
                                aria-label="Mês anterior"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <div className="text-sm font-semibold text-slate-100 capitalize">{monthLabel}</div>
                            <button
                                type="button"
                                onClick={() => goToMonth(1)}
                                className="p-1.5 rounded-md border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-800 transition-colors"
                                aria-label="Próximo mês"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 mb-1.5">
                            {weekdays.map((d, idx) => (
                                <div
                                    key={`${d}-${idx}`}
                                    className="text-[11px] font-medium text-slate-400 text-center py-1"
                                >
                                    {d}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map(({ date, iso, isCurrentMonth }) => {
                                const isSelected = iso === selectedISO;
                                const isToday = iso === todayISO;
                                return (
                                    <button
                                        key={iso}
                                        type="button"
                                        onClick={() => selectISOFromCalendar(iso)}
                                        className={[
                                            "h-9 rounded-lg text-sm border transition-colors",
                                            isCurrentMonth ? "text-slate-100" : "text-slate-500",
                                            isSelected
                                                ? "bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/20"
                                                : isToday
                                                  ? "border-blue-500/60 bg-blue-500/10"
                                                  : "border-transparent hover:border-slate-600 hover:bg-slate-800/80",
                                        ].join(" ")}
                                        aria-pressed={isSelected}
                                    >
                                        {date.getDate()}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={() => {
                                    onChangeISO("");
                                    setText("");
                                    setInputError("");
                                }}
                                className="text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                            >
                                Limpar
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    selectISOFromCalendar(todayISO);
                                }}
                                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Hoje
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {helperMessage && (
                <p className="text-xs text-red-300 mt-1" role="alert">
                    {helperMessage}
                </p>
            )}
        </div>
    );
}

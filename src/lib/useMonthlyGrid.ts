// ============================================================
// useMonthlyGrid — Optimistic Grid State Management
// ============================================================
// This hook manages the monthly grid with:
//   • Initial fetch from Supabase (once per month change)
//   • Optimistic local updates (instant, no refetch)
//   • Background DB sync (silent save/delete)
//   • Automatic rollback on error
//
// Pattern: "Optimistic Update with Background Sync"
//   1. User edits cell → local state updates immediately
//   2. DB write fires in background
//   3. On success: nothing (already showing correct state)
//   4. On error: revert the local cell + show toast
// ============================================================

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "../lib/supabase";
import type { MonthlyGrid, GridCell } from "../types";
import { CATEGORIES } from "./constants";
import { getDaysInMonth, toDateString, buildMonthlyGrid } from "./utils";

interface UseMonthlyGridResult {
    grid: MonthlyGrid;
    loading: boolean;
    error: string | null;
    /** Optimistic cell update — updates UI immediately, syncs DB in background */
    updateCell: (day: number, category: string, amount: number | null) => void;
    /** Column totals derived from current grid state */
    columnTotals: Record<string, number>;
    /** Grand total across all categories */
    grandTotal: number;
}

export function useMonthlyGrid(year: number, month: number): UseMonthlyGridResult {
    const [grid, setGrid] = useState<MonthlyGrid>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Track the active month to avoid stale updates
    const activeMonth = useRef({ year, month });
    activeMonth.current = { year, month };

    // ── Initial fetch ────────────────────────────────────────

    useEffect(() => {
        let cancelled = false;

        async function fetch() {
            setLoading(true);
            setError(null);

            const days = getDaysInMonth(year, month);
            const startDate = toDateString(year, month, 1);
            const endDate = toDateString(year, month, days);

            const { data, error: dbError } = await supabase
                .from("expenses")
                .select("*")
                .gte("expense_date", startDate)
                .lte("expense_date", endDate)
                .order("expense_date", { ascending: true });

            if (cancelled) return;

            if (dbError) {
                setError(dbError.message);
                setGrid({});
            } else {
                setGrid(buildMonthlyGrid(data ?? [], year, month));
            }
            setLoading(false);
        }

        fetch();
        return () => { cancelled = true; };
    }, [year, month]);

    // ── Optimistic cell update ───────────────────────────────

    const updateCell = useCallback(
        (day: number, category: string, amount: number | null) => {
            const capturedYear = activeMonth.current.year;
            const capturedMonth = activeMonth.current.month;

            // 1. Snapshot the old cell value (for rollback)
            const oldCell: GridCell = grid[day]?.[category]
                ? { ...grid[day][category] }
                : { id: null, amount: null, remarks: null };

            // 2. Skip if nothing changed
            if (oldCell.amount === amount) return;
            if (oldCell.amount === null && (amount === null || amount === 0)) return;

            // 3. Optimistic update — instant UI change
            setGrid((prev) => {
                const next = { ...prev };
                next[day] = { ...next[day] };
                next[day][category] = {
                    ...next[day][category],
                    amount: amount === 0 ? null : amount,
                };
                return next;
            });

            // 4. Background DB sync
            const dateStr = toDateString(capturedYear, capturedMonth, day);

            if (amount === null || amount === 0) {
                // Delete
                supabase
                    .from("expenses")
                    .delete()
                    .eq("expense_date", dateStr)
                    .eq("category", category)
                    .then(({ error: dbError }) => {
                        if (dbError) rollback(day, category, oldCell);
                    });
            } else {
                // Upsert
                supabase
                    .from("expenses")
                    .upsert(
                        { expense_date: dateStr, category, amount },
                        { onConflict: "expense_date,category" }
                    )
                    .then(({ error: dbError }) => {
                        if (dbError) rollback(day, category, oldCell);
                    });
            }
        },
        [grid]
    );

    // ── Rollback on error ────────────────────────────────────

    const rollback = useCallback(
        (day: number, category: string, oldCell: GridCell) => {
            setGrid((prev) => {
                const next = { ...prev };
                next[day] = { ...next[day] };
                next[day][category] = oldCell;
                return next;
            });
            setError("Failed to save — change reverted");
            // Auto-clear error after 3s
            setTimeout(() => setError(null), 3000);
        },
        []
    );

    // ── Derived computations ─────────────────────────────────

    const columnTotals = useMemo(() => {
        const totals: Record<string, number> = {};
        for (const cat of CATEGORIES) {
            totals[cat] = 0;
        }
        for (const dayData of Object.values(grid)) {
            for (const cat of CATEGORIES) {
                totals[cat] += dayData[cat]?.amount ?? 0;
            }
        }
        return totals;
    }, [grid]);

    const grandTotal = useMemo(
        () => Object.values(columnTotals).reduce((sum, v) => sum + v, 0),
        [columnTotals]
    );

    return { grid, loading, error, updateCell, columnTotals, grandTotal };
}

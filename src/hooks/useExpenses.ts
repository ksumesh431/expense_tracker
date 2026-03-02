// ============================================================
// Supabase Data Hooks
// ============================================================
// Custom hooks for all data operations. Each hook returns
// { data, loading, error } and handles its own lifecycle.
//
// Performance considerations:
//   • All queries are scoped to date ranges (never fetch everything)
//   • Upsert uses ON CONFLICT to avoid roundtrips
//   • Loading states prevent duplicate fetches
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Expense } from "../types";
import { getDaysInMonth, toDateString } from "../lib/utils";

// ── Monthly Expenses ──────────────────────────────────────────

interface UseMonthlyExpensesResult {
    expenses: Expense[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

/**
 * Fetches all expenses for a specific month.
 * Only queries the exact date range — never scans the whole table.
 */
export function useMonthlyExpenses(year: number, month: number): UseMonthlyExpensesResult {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
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

        if (dbError) {
            setError(dbError.message);
            setExpenses([]);
        } else {
            setExpenses(data ?? []);
        }
        setLoading(false);
    }, [year, month]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { expenses, loading, error, refetch: fetch };
}

// ── Annual Expenses ───────────────────────────────────────────

interface UseAnnualExpensesResult {
    expenses: Expense[];
    loading: boolean;
    error: string | null;
}

/**
 * Fetches all expenses for a full year.
 * Used by the Summary page and Dashboard.
 */
export function useAnnualExpenses(year: number): UseAnnualExpensesResult {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetch() {
            setLoading(true);
            setError(null);

            const { data, error: dbError } = await supabase
                .from("expenses")
                .select("*")
                .gte("expense_date", `${year}-01-01`)
                .lte("expense_date", `${year}-12-31`)
                .order("expense_date", { ascending: true });

            if (dbError) {
                setError(dbError.message);
                setExpenses([]);
            } else {
                setExpenses(data ?? []);
            }
            setLoading(false);
        }
        fetch();
    }, [year]);

    return { expenses, loading, error };
}

// ── Upsert Expense ────────────────────────────────────────────

/**
 * Insert or update a single expense cell.
 * Uses the unique constraint on (expense_date, category).
 *
 * If amount is 0 or null, deletes the row instead (keeps DB clean).
 */
export async function upsertExpense(
    date: string,
    category: string,
    amount: number | null
): Promise<{ success: boolean; error?: string }> {
    // Delete if amount is zero or null
    if (amount === null || amount === 0) {
        const { error } = await supabase
            .from("expenses")
            .delete()
            .eq("expense_date", date)
            .eq("category", category);

        return error ? { success: false, error: error.message } : { success: true };
    }

    // Upsert: insert or update on conflict
    const { error } = await supabase
        .from("expenses")
        .upsert(
            { expense_date: date, category, amount },
            { onConflict: "expense_date,category" }
        );

    return error ? { success: false, error: error.message } : { success: true };
}

// ── Dashboard Data ────────────────────────────────────────────

interface UseDashboardDataResult {
    currentMonth: Expense[];
    lastMonth: Expense[];
    loading: boolean;
    error: string | null;
}

/**
 * Fetches current month + previous month expenses for dashboard comparison.
 * Two parallel queries for efficiency.
 */
export function useDashboardData(year: number, month: number): UseDashboardDataResult {
    const [currentMonth, setCurrentMonth] = useState<Expense[]>([]);
    const [lastMonth, setLastMonth] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetch() {
            setLoading(true);
            setError(null);

            const curDays = getDaysInMonth(year, month);
            const curStart = toDateString(year, month, 1);
            const curEnd = toDateString(year, month, curDays);

            // Previous month
            const prevMonth = month === 0 ? 11 : month - 1;
            const prevYear = month === 0 ? year - 1 : year;
            const prevDays = getDaysInMonth(prevYear, prevMonth);
            const prevStart = toDateString(prevYear, prevMonth, 1);
            const prevEnd = toDateString(prevYear, prevMonth, prevDays);

            // Parallel queries
            const [curRes, prevRes] = await Promise.all([
                supabase
                    .from("expenses")
                    .select("*")
                    .gte("expense_date", curStart)
                    .lte("expense_date", curEnd),
                supabase
                    .from("expenses")
                    .select("*")
                    .gte("expense_date", prevStart)
                    .lte("expense_date", prevEnd),
            ]);

            if (curRes.error || prevRes.error) {
                setError(curRes.error?.message ?? prevRes.error?.message ?? "Unknown error");
            } else {
                setCurrentMonth(curRes.data ?? []);
                setLastMonth(prevRes.data ?? []);
            }
            setLoading(false);
        }
        fetch();
    }, [year, month]);

    return { currentMonth, lastMonth, loading, error };
}

// ============================================================
// Utility Functions
// ============================================================
// Pure, testable helper functions used across the app.
// No side effects, no Supabase calls — just data transformations.
// ============================================================

import type { Expense, MonthlyGrid, GridCell, AnnualCategoryRow, DashboardStats, CategoryTotal } from "../types";
import { CATEGORIES, CURRENCY_LOCALE, CURRENCY_CODE, REMARKS_CATEGORY } from "./constants";

// ── Date Helpers ──────────────────────────────────────────────

/** Returns number of days in a given month (1-indexed month) */
export function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

/** Formats a year + month (0-indexed) + day into "YYYY-MM-DD" */
export function toDateString(year: number, month: number, day: number): string {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
}

/** Extracts day-of-month from an ISO date string */
export function dayFromDate(dateStr: string): number {
    return new Date(dateStr).getDate();
}

/** Extracts 0-indexed month from an ISO date string */
export function monthFromDate(dateStr: string): number {
    return new Date(dateStr).getMonth();
}

// ── Currency Formatting ───────────────────────────────────────

const currencyFormatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: "currency",
    currency: CURRENCY_CODE,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

/** Format a number as INR currency string, e.g. ₹1,550 */
export function formatCurrency(amount: number): string {
    return currencyFormatter.format(amount);
}

/** Format a number with commas, no currency symbol */
export function formatNumber(amount: number): string {
    return new Intl.NumberFormat(CURRENCY_LOCALE, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

// ── Grid Builders ─────────────────────────────────────────────

/** Empty grid cell */
const EMPTY_CELL: GridCell = { id: null, amount: null, remarks: null };

/**
 * Transforms a flat array of Expense rows into a day × category grid.
 * O(n) where n = number of expenses in the month (typically 0–500).
 */
export function buildMonthlyGrid(expenses: Expense[], year: number, month: number): MonthlyGrid {
    const days = getDaysInMonth(year, month);
    const grid: MonthlyGrid = {};

    // Pre-allocate empty rows for each day
    for (let d = 1; d <= days; d++) {
        grid[d] = {};
        for (const cat of CATEGORIES) {
            grid[d][cat] = { ...EMPTY_CELL };
        }
        grid[d][REMARKS_CATEGORY] = { ...EMPTY_CELL };
    }

    // Fill in actual data
    for (const expense of expenses) {
        const day = dayFromDate(expense.expense_date);
        const cat = expense.category;
        if (grid[day] && cat in grid[day]) {
            grid[day][cat] = {
                id: expense.id,
                amount: expense.amount,
                remarks: expense.remarks,
            };
        }
    }

    return grid;
}

/**
 * Computes column totals (one per category) from the monthly grid.
 * Returns a Record<category, total>.
 */
export function computeColumnTotals(grid: MonthlyGrid): Record<string, number> {
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
}

/**
 * Computes row totals (one per day) from the monthly grid.
 */
export function computeRowTotal(dayData: Record<string, GridCell>): number {
    let total = 0;
    for (const cat of CATEGORIES) {
        total += dayData[cat]?.amount ?? 0;
    }
    return total;
}

// ── Annual Summary Builder ────────────────────────────────────

/**
 * Transforms a full year of expenses into category × month matrix.
 * O(n) where n = total expenses in the year.
 */
export function buildAnnualSummary(expenses: Expense[]): AnnualCategoryRow[] {
    // Initialize: each category gets 12 months of zeroes
    const map = new Map<string, number[]>();
    for (const cat of CATEGORIES) {
        map.set(cat, new Array(12).fill(0));
    }

    // Accumulate
    for (const expense of expenses) {
        const month = monthFromDate(expense.expense_date);
        const row = map.get(expense.category);
        if (row) {
            row[month] += expense.amount;
        }
    }

    // Convert to array
    return CATEGORIES.map((cat) => {
        const months = map.get(cat) ?? new Array(12).fill(0);
        const total = months.reduce((sum, v) => sum + v, 0);
        return { category: cat, months, total };
    });
}

// ── Dashboard Stats Builder ───────────────────────────────────

/**
 * Computes dashboard statistics from current month and last month expenses.
 */
export function buildDashboardStats(
    currentMonthExpenses: Expense[],
    lastMonthExpenses: Expense[],
    daysInMonth: number
): DashboardStats {
    // Category totals for current month
    const catMap = new Map<string, number>();
    let totalThisMonth = 0;

    for (const e of currentMonthExpenses) {
        totalThisMonth += e.amount;
        catMap.set(e.category, (catMap.get(e.category) ?? 0) + e.amount);
    }

    let totalLastMonth = 0;
    for (const e of lastMonthExpenses) {
        totalLastMonth += e.amount;
    }

    // Find top category
    let topCategory = "-";
    let topCategoryAmount = 0;
    for (const [cat, amt] of catMap) {
        if (amt > topCategoryAmount) {
            topCategory = cat;
            topCategoryAmount = amt;
        }
    }

    // Category breakdown sorted descending
    const categoryBreakdown: CategoryTotal[] = CATEGORIES
        .map((cat) => ({
            category: cat,
            total: catMap.get(cat) ?? 0,
            percentage: totalThisMonth > 0 ? ((catMap.get(cat) ?? 0) / totalThisMonth) * 100 : 0,
        }))
        .filter((c) => c.total > 0)
        .sort((a, b) => b.total - a.total);

    const today = new Date().getDate();
    const daysSoFar = Math.min(today, daysInMonth);

    return {
        totalThisMonth,
        totalLastMonth,
        dailyAverage: daysSoFar > 0 ? Math.round(totalThisMonth / daysSoFar) : 0,
        topCategory,
        topCategoryAmount,
        categoryBreakdown,
    };
}

// ── Class Name Utility ────────────────────────────────────────

/** Merge class names, filtering out falsy values */
export function cn(...classes: (string | false | null | undefined)[]): string {
    return classes.filter(Boolean).join(" ");
}

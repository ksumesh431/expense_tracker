// ============================================================
// Type Definitions
// ============================================================
// Central type registry for the entire app.
// All Supabase row shapes and derived UI types live here.
// ============================================================

/** Row shape matching the Supabase `expenses` table */
export interface Expense {
    id: string;
    expense_date: string;   // ISO date string "YYYY-MM-DD"
    category: string;
    amount: number;
    remarks: string | null;
    created_at: string;
    updated_at: string;
}

/** Payload for inserting/upserting an expense (no id or timestamps) */
export interface ExpenseUpsert {
    expense_date: string;
    category: string;
    amount: number;
    remarks?: string | null;
}

/**
 * Monthly grid cell — represents one (day, category) intersection.
 * `null` means no expense recorded for that cell.
 */
export interface GridCell {
    id: string | null;
    amount: number | null;
    remarks: string | null;
}

/**
 * The full monthly grid: day number (1–31) → category → cell data.
 * Outer key is day-of-month, inner key is category name.
 */
export type MonthlyGrid = Record<number, Record<string, GridCell>>;

/**
 * Annual summary row — one per category showing 12 monthly totals.
 */
export interface AnnualCategoryRow {
    category: string;
    months: number[];  // index 0 = Jan, 11 = Dec
    total: number;
}

/** Dashboard stats computed from expense data */
export interface DashboardStats {
    totalThisMonth: number;
    totalLastMonth: number;
    dailyAverage: number;
    topCategory: string;
    topCategoryAmount: number;
    categoryBreakdown: CategoryTotal[];
}

export interface CategoryTotal {
    category: string;
    total: number;
    percentage: number;
}

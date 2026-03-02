// ============================================================
// Annual Summary Page — Category × Month Matrix
// ============================================================
// Replicates the Excel Summary sheet exactly:
//   Rows = categories, Columns = Jan–Dec + Total
//   Grand total row at bottom.
//   Color-coded cells for quick visual scanning.
// ============================================================

import { useMemo } from "react";
import { useAnnualExpenses } from "../hooks/useExpenses";
import { MONTH_SHORT } from "../lib/constants";
import { buildAnnualSummary, formatNumber, cn } from "../lib/utils";
import { Loader2 } from "lucide-react";
import type { AnnualCategoryRow } from "../types";

interface SummaryProps {
    year: number;
}

export default function Summary({ year }: SummaryProps) {
    const { expenses, loading, error } = useAnnualExpenses(year);

    const rows = useMemo(() => buildAnnualSummary(expenses), [expenses]);

    // Monthly grand totals (sum of all categories per month)
    const monthlyTotals = useMemo(() => {
        const totals = new Array(12).fill(0);
        for (const row of rows) {
            for (let m = 0; m < 12; m++) {
                totals[m] += row.months[m];
            }
        }
        return totals;
    }, [rows]);

    const grandTotal = useMemo(
        () => monthlyTotals.reduce((sum, v) => sum + v, 0),
        [monthlyTotals]
    );

    // Determine max value for heat coloring
    const maxVal = useMemo(() => {
        let max = 0;
        for (const row of rows) {
            for (const v of row.months) {
                if (v > max) max = v;
            }
        }
        return max;
    }, [rows]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-text-muted">
                <Loader2 className="animate-spin mr-2" size={20} />
                Loading annual summary...
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-card p-6 text-danger text-sm">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="mb-5">
                <h2 className="text-xl font-bold text-text-heading">Annual Summary — {year}</h2>
                <p className="text-sm text-text-muted mt-1">Category-wise monthly breakdown</p>
            </div>

            {/* Summary Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm" style={{ minWidth: "900px" }}>
                        <thead>
                            <tr style={{ backgroundColor: "var(--color-grid-header)" }}>
                                <th className="sticky left-0 z-10 px-3 py-2.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border-subtle"
                                    style={{ backgroundColor: "var(--color-grid-header)", minWidth: "160px" }}>
                                    Category
                                </th>
                                {MONTH_SHORT.map((m) => (
                                    <th
                                        key={m}
                                        className="px-2 py-2.5 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border-subtle"
                                        style={{ minWidth: "72px" }}
                                    >
                                        {m}
                                    </th>
                                ))}
                                <th className="px-3 py-2.5 text-right text-xs font-semibold text-accent uppercase tracking-wider border-b border-border-subtle border-l-2 border-l-accent/30"
                                    style={{ minWidth: "85px" }}>
                                    Total
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {rows.map((row, idx) => (
                                <SummaryRow key={row.category} row={row} index={idx} maxVal={maxVal} />
                            ))}

                            {/* Grand Total Row */}
                            <tr style={{ backgroundColor: "var(--color-grid-header)" }}>
                                <td className="sticky left-0 z-10 px-3 py-3 text-sm font-bold text-accent border-t-2 border-accent"
                                    style={{ backgroundColor: "var(--color-grid-header)" }}>
                                    Total
                                </td>
                                {monthlyTotals.map((total, i) => (
                                    <td
                                        key={i}
                                        className="px-2 py-3 text-right text-sm font-bold text-text-heading border-t-2 border-accent tabular-nums"
                                    >
                                        {total > 0 ? formatNumber(total) : "-"}
                                    </td>
                                ))}
                                <td className="px-3 py-3 text-right text-sm font-extrabold text-accent border-t-2 border-accent border-l-2 border-l-accent/50 tabular-nums">
                                    {formatNumber(grandTotal)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ── Summary Row ───────────────────────────────────────────────

interface SummaryRowProps {
    row: AnnualCategoryRow;
    index: number;
    maxVal: number;
}

function SummaryRow({ row, index, maxVal }: SummaryRowProps) {
    return (
        <tr className={cn(
            "border-b border-border-subtle transition-colors hover:bg-bg-hover",
            index % 2 === 0 && "grid-row-even"
        )}>
            <td
                className="sticky left-0 z-10 px-3 py-2 text-sm font-medium text-text-primary border-r border-border-subtle"
                style={{
                    backgroundColor: "var(--color-bg-card)",
                    backgroundImage: index % 2 === 0 ? "linear-gradient(var(--color-grid-row-even), var(--color-grid-row-even))" : "none"
                }}
            >
                {row.category}
            </td>
            {row.months.map((val, m) => (
                <td
                    key={m}
                    className={cn(
                        "px-2 py-2 text-right text-sm tabular-nums",
                        getHeatClass(val, maxVal)
                    )}
                >
                    {val > 0 ? formatNumber(val) : "-"}
                </td>
            ))}
            <td className="px-3 py-2 text-right text-sm font-semibold text-text-heading border-l-2 border-l-border tabular-nums bg-[var(--color-bg-primary)]/10">
                {row.total > 0 ? formatNumber(row.total) : "-"}
            </td>
        </tr>
    );
}

/** Returns a heat color class based on value relative to max */
function getHeatClass(value: number, max: number): string {
    if (value === 0 || max === 0) return "text-text-muted";
    const ratio = value / max;
    if (ratio > 0.8) return "heat-5";
    if (ratio > 0.6) return "heat-4";
    if (ratio > 0.4) return "heat-3";
    if (ratio > 0.2) return "heat-2";
    return "heat-1";
}

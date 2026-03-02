// ============================================================
// Monthly Entry Page — Spreadsheet Grid
// ============================================================
// Uses optimistic updates: cell edits are instant, DB syncs
// in the background. No full-page refetch on each edit.
// ============================================================

import { useState, useCallback, useRef, memo } from "react";
import { useMonthlyGrid } from "../lib/useMonthlyGrid";
import { CATEGORIES, MONTH_SHORT, CURRENT_MONTH } from "../lib/constants";
import { getDaysInMonth, formatNumber, cn } from "../lib/utils";
import { Loader2 } from "lucide-react";

interface MonthlyEntryProps {
  year: number;
}

/** Shorter display labels for narrow columns */
const CATEGORY_SHORT: Record<string, string> = {
  "Book/Stationery": "Books",
  "Cosmetics/Canteen": "Cosm/Canteen",
  "Vehicle Maintenance": "Vehicle Maint.",
  "Mob/Net/Dish": "Mob/Net",
  "Insurance/SIP": "Ins/SIP",
  "Other Expdr": "Other",
  "Elect Bill": "Elect",
};

function shortLabel(cat: string): string {
  return CATEGORY_SHORT[cat] ?? cat;
}

export default function MonthlyEntry({ year }: MonthlyEntryProps) {
  const [month, setMonth] = useState(CURRENT_MONTH);
  const { grid, loading, error, updateCell, columnTotals, grandTotal } = useMonthlyGrid(year, month);

  const days = getDaysInMonth(year, month);
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const todayDay = today.getDate();

  return (
    <div className="animate-fade-in">
      {/* Page Title */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-text-heading">Monthly Expenditure</h2>
        <p className="text-xs text-text-muted mt-0.5">Click any cell to enter an expense · Tab/Enter to navigate</p>
      </div>

      {/* Month Tabs */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {MONTH_SHORT.map((m, i) => (
          <button
            key={m}
            onClick={() => setMonth(i)}
            className={cn("month-tab", i === month && "month-tab-active")}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Error Toast */}
      {error && (
        <div className="glass-card p-3 mb-4 text-danger text-xs animate-fade-in">
          ⚠ {error}
        </div>
      )}

      {/* Grid */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse expense-grid" style={{ minWidth: "1100px" }}>
            {/* Header */}
            <thead>
              <tr style={{ backgroundColor: "var(--color-grid-header)" }}>
                <th className="sticky left-0 z-10 px-3 py-2 text-left text-[11px] font-semibold text-text-secondary tracking-wider border-b border-border w-[48px]"
                  style={{ backgroundColor: "var(--color-grid-header)" }}>
                  Day
                </th>
                {CATEGORIES.map((cat) => (
                  <th
                    key={cat}
                    className="px-1 py-2 text-center text-[11px] font-semibold text-text-secondary tracking-wide border-b border-border whitespace-nowrap"
                    style={{ minWidth: "70px", maxWidth: "90px" }}
                    title={cat}
                  >
                    {shortLabel(cat)}
                  </th>
                ))}
                <th className="px-3 py-2 text-right text-[11px] font-bold text-accent tracking-wider border-b border-border border-l border-border w-[72px]">
                  Day Total
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={CATEGORIES.length + 2} className="py-16 text-center text-text-muted text-sm">
                    <Loader2 className="inline animate-spin mr-2" size={16} />
                    Loading...
                  </td>
                </tr>
              ) : (
                <>
                  {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
                    const dayData = grid[day];
                    if (!dayData) return null;

                    // Compute row total inline
                    let rowTotal = 0;
                    for (const cat of CATEGORIES) {
                      rowTotal += dayData[cat]?.amount ?? 0;
                    }

                    const isToday = isCurrentMonth && day === todayDay;

                    return (
                      <tr
                        key={day}
                        className={cn(
                          "border-b transition-colors",
                          isToday
                            ? "grid-row-today border-accent/20"
                            : day % 2 === 0
                              ? "grid-row-even border-border-subtle"
                              : "border-border-subtle"
                        )}
                      >
                        {/* Day */}
                        <td
                          className={cn(
                            "sticky left-0 z-10 px-3 py-0 text-xs font-semibold text-center border-r",
                            isToday ? "text-accent" : "text-text-muted"
                          )}
                          style={{
                            backgroundColor: isToday
                              ? "var(--color-grid-today)"
                              : day % 2 === 0
                                ? "rgba(255,255,255,0.015)"
                                : "var(--color-bg-card)",
                            borderColor: "var(--color-grid-border)",
                            height: "30px",
                          }}
                        >
                          {day}
                        </td>

                        {/* Category Cells */}
                        {CATEGORIES.map((cat) => (
                          <EditableCell
                            key={cat}
                            day={day}
                            category={cat}
                            amount={dayData[cat]?.amount ?? null}
                            onUpdate={updateCell}
                          />
                        ))}

                        {/* Row Total */}
                        <td
                          className="px-2 py-0 text-right text-xs font-semibold tabular-nums border-l"
                          style={{
                            borderColor: "var(--color-grid-border)",
                            color: rowTotal > 0 ? "var(--color-accent)" : "transparent",
                            height: "30px",
                          }}
                        >
                          {rowTotal > 0 ? formatNumber(rowTotal) : ""}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Grand Total Row */}
                  <tr style={{ backgroundColor: "var(--color-grid-header)" }}>
                    <td className="sticky left-0 z-10 px-3 py-2.5 text-xs font-bold text-accent border-t-2 border-accent"
                      style={{ backgroundColor: "var(--color-grid-header)" }}>
                      Total
                    </td>
                    {CATEGORIES.map((cat) => (
                      <td
                        key={cat}
                        className="px-1 py-2.5 text-center text-xs font-bold text-text-heading border-t-2 border-accent tabular-nums"
                      >
                        {columnTotals[cat] > 0 ? formatNumber(columnTotals[cat]) : "–"}
                      </td>
                    ))}
                    <td className="px-2 py-2.5 text-right text-xs font-extrabold text-accent border-t-2 border-accent border-l tabular-nums"
                      style={{ borderLeftColor: "var(--color-grid-border)" }}>
                      {grandTotal > 0 ? formatNumber(grandTotal) : "0"}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Editable Cell (memoized) ──────────────────────────────────
// React.memo ensures only the edited cell re-renders, not all 31×16 cells.

interface EditableCellProps {
  day: number;
  category: string;
  amount: number | null;
  onUpdate: (day: number, category: string, amount: number | null) => void;
}

const EditableCell = memo(function EditableCell({
  day,
  category,
  amount,
  onUpdate,
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = useCallback(() => {
    setValue(amount !== null && amount > 0 ? String(amount) : "");
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [amount]);

  const commit = useCallback(() => {
    setEditing(false);
    const newAmount = value.trim() === "" ? null : parseFloat(value);

    // Skip if nothing changed
    if (newAmount === amount || (newAmount === null && amount === null)) return;
    if (newAmount !== null && isNaN(newAmount)) return;

    // Optimistic update — fires instantly, DB syncs in background
    onUpdate(day, category, newAmount);
  }, [value, amount, day, category, onUpdate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        commit();
        // Navigate to next cell
        const parent = (e.currentTarget as HTMLElement).parentElement;
        const nextCell = e.key === "Tab"
          ? parent?.nextElementSibling
          : parent?.parentElement?.nextElementSibling?.children[
          Array.from(parent!.parentElement!.children).indexOf(parent!)
          ];
        if (nextCell) (nextCell as HTMLElement).click();
      } else if (e.key === "Escape") {
        setEditing(false);
      }
    },
    [commit]
  );

  return (
    <td
      className="grid-cell px-0 py-0 text-right text-xs"
      onClick={!editing ? startEditing : undefined}
      style={{ height: "30px" }}
    >
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className="h-full text-xs"
          min="0"
          step="1"
        />
      ) : (
        <span className={cn(
          "block px-2 h-full flex items-center justify-center text-xs",
          amount && amount > 0 ? "amount-positive" : ""
        )}>
          {amount !== null && amount > 0 ? formatNumber(amount) : ""}
        </span>
      )}
    </td>
  );
});
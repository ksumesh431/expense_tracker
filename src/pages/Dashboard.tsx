// ============================================================
// Dashboard Page — Overview & Quick Stats
// ============================================================

import { useMemo } from "react";
import { useDashboardData } from "../hooks/useExpenses";
import { CURRENT_MONTH, MONTH_NAMES } from "../lib/constants";
import { buildDashboardStats, formatCurrency, getDaysInMonth, cn } from "../lib/utils";
import { TrendingUp, TrendingDown, IndianRupee, BarChart3, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";

interface DashboardProps {
  year: number;
}

export default function Dashboard({ year }: DashboardProps) {
  const month = CURRENT_MONTH;
  const { currentMonth, lastMonth, loading, error } = useDashboardData(year, month);

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const stats = useMemo(
    () => buildDashboardStats(currentMonth, lastMonth, days),
    [currentMonth, lastMonth, days]
  );

  const monthChange = stats.totalLastMonth > 0
    ? ((stats.totalThisMonth - stats.totalLastMonth) / stats.totalLastMonth) * 100
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        <Loader2 className="animate-spin mr-2" size={20} />
        Loading dashboard...
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
    <div className="animate-fade-in space-y-5">
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-bold text-text-heading">{MONTH_NAMES[month]} {year}</h2>
        <p className="text-sm text-text-muted mt-1">Your expense overview for this month</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total This Month */}
        <div className="glass-card stat-card stat-card-teal p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">This Month</span>
            <IndianRupee size={16} className="text-accent" />
          </div>
          <p className="text-xl font-bold text-text-heading tabular-nums">
            {formatCurrency(stats.totalThisMonth)}
          </p>
          {stats.totalLastMonth > 0 && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-xs font-medium",
              monthChange <= 0 ? "text-success" : "text-danger"
            )}>
              {monthChange <= 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
              {Math.abs(monthChange).toFixed(1)}% vs last month
            </div>
          )}
        </div>

        {/* Last Month */}
        <div className="glass-card stat-card stat-card-blue p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Last Month</span>
            {monthChange <= 0 ? <TrendingDown size={16} className="text-success" /> : <TrendingUp size={16} className="text-danger" />}
          </div>
          <p className="text-xl font-bold text-text-heading tabular-nums">
            {formatCurrency(stats.totalLastMonth)}
          </p>
          <p className="text-xs text-text-muted mt-2">
            {MONTH_NAMES[month === 0 ? 11 : month - 1]}
          </p>
        </div>

        {/* Daily Average */}
        <div className="glass-card stat-card stat-card-amber p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Daily Avg</span>
            <BarChart3 size={16} className="text-warning" />
          </div>
          <p className="text-xl font-bold text-text-heading tabular-nums">
            {formatCurrency(stats.dailyAverage)}
          </p>
          <p className="text-xs text-text-muted mt-2">per day this month</p>
        </div>

        {/* Top Category */}
        <div className="glass-card stat-card stat-card-emerald p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Top Category</span>
            <TrendingUp size={16} className="text-success" />
          </div>
          <p className="text-lg font-bold text-text-heading truncate">{stats.topCategory}</p>
          <p className="text-sm text-text-secondary tabular-nums mt-1">
            {formatCurrency(stats.topCategoryAmount)}
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="glass-card p-4">
        <h3 className="text-xs font-semibold text-text-heading mb-4 uppercase tracking-wider">
          Category Breakdown
        </h3>
        {stats.categoryBreakdown.length === 0 ? (
          <p className="text-sm text-text-muted py-4 text-center">No expenses recorded this month</p>
        ) : (
          <div className="space-y-3">
            {stats.categoryBreakdown.map((cat) => (
              <div key={cat.category} className="group">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-text-secondary group-hover:text-text-primary transition-colors">
                    {cat.category}
                  </span>
                  <span className="text-text-heading font-semibold tabular-nums">
                    {formatCurrency(cat.total)}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-bg-hover)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.max(cat.percentage, 2)}%`,
                      background: "linear-gradient(90deg, var(--color-accent), #06b6d4)",
                    }}
                  />
                </div>
                <p className="text-xs text-text-muted mt-0.5 tabular-nums">
                  {cat.percentage.toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
// ============================================================
// Layout — Sidebar + Top Bar Shell
// ============================================================

import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, CalendarDays, TableProperties, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";
import { CURRENT_YEAR } from "../lib/constants";

interface NavItem {
    to: string;
    label: string;
    icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
    { to: "/", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { to: "/monthly", label: "Monthly Entry", icon: <CalendarDays size={20} /> },
    { to: "/summary", label: "Annual Summary", icon: <TableProperties size={20} /> },
];

interface LayoutProps {
    year: number;
    onYearChange: (year: number) => void;
}

export default function Layout({ year, onYearChange }: LayoutProps) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="fixed inset-0 flex overflow-hidden bg-bg-primary">
            {/* ── Sidebar ──────────────────────────────────────── */}
            <aside
                className={cn(
                    "hidden md:flex flex-col border-r border-border transition-all duration-200",
                    collapsed ? "w-[var(--sidebar-collapsed)]" : "w-[var(--sidebar-width)]"
                )}
                style={{ backgroundColor: "var(--color-sidebar-bg)" }}
            >
                {/* Logo / Brand */}
                <div className="flex items-center gap-2.5 px-4 h-[var(--topbar-height)] border-b border-border flex-shrink-0">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs"
                        style={{ background: "linear-gradient(135deg, #2dd4a8, #22d3ee)", color: "#0c0e14" }}>
                        E
                    </div>
                    {!collapsed && (
                        <span className="font-semibold text-text-heading text-[13px] tracking-wide animate-fade-in">
                            Expdr {CURRENT_YEAR}
                        </span>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === "/"}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all",
                                    "hover:bg-bg-hover",
                                    isActive && "nav-link-active"
                                )
                            }
                        >
                            {item.icon}
                            {!collapsed && <span>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Collapse Toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex items-center justify-center h-9 border-t border-border text-text-muted hover:text-text-primary transition-colors"
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </aside>

            {/* ── Main Area ────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
                {/* Top Bar */}
                <header
                    className="flex items-center justify-between px-6 h-[var(--topbar-height)] border-b border-border flex-shrink-0"
                    style={{ backgroundColor: "var(--color-bg-secondary)" }}
                >
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-semibold text-text-heading">Expense Tracker</h1>
                        <button
                            onClick={() => window.location.reload()}
                            className="p-1 rounded-md text-text-muted hover:text-accent hover:bg-bg-hover transition-colors"
                            aria-label="Refresh page"
                            title="Refresh data"
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>

                    {/* Year Selector */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onYearChange(year - 1)}
                            className="p-1.5 rounded-md hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors focus-ring"
                            aria-label="Previous year"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-semibold text-text-heading min-w-[48px] text-center tabular-nums">
                            {year}
                        </span>
                        <button
                            onClick={() => onYearChange(year + 1)}
                            disabled={year >= CURRENT_YEAR}
                            className={cn(
                                "p-1.5 rounded-md transition-colors focus-ring",
                                year >= CURRENT_YEAR
                                    ? "text-text-muted cursor-not-allowed"
                                    : "hover:bg-bg-hover text-text-secondary hover:text-text-primary"
                            )}
                            aria-label="Next year"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </header>

                {/* Scrollable wrapper JUST for page content */}
                <div className="flex-1 overflow-auto flex flex-col" style={{ backgroundColor: "var(--color-bg-primary)" }}>
                    <main className="p-6 flex-1 flex-shrink-0">
                        <Outlet />
                    </main>
                </div>

                {/* ── Mobile Bottom Nav (fixed flex footer) ── */}
                <nav className="md:hidden flex border-t border-border z-20 flex-shrink-0"
                    style={{ backgroundColor: "var(--color-sidebar-bg)", paddingBottom: "env(safe-area-inset-bottom)" }}>
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === "/"}
                            className={({ isActive }) =>
                                cn(
                                    "flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                                    isActive ? "text-accent" : "text-text-muted hover:text-text-secondary"
                                )
                            }
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>
        </div>
    );
}

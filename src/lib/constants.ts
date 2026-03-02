// ============================================================
// App Constants — Single Source of Truth
// ============================================================
// To add a new expense category:  just append to CATEGORIES below.
// Everything else (grid columns, summary rows, DB queries) adapts automatically.
// ============================================================

/**
 * Expense categories — order here determines column order in the grid.
 * To add/remove categories, simply edit this array.
 */
export const CATEGORIES = [
    "Milk",
    "Veg",
    "Fruits",
    "Ration",
    "N/Veg",
    "Petrol",
    "Book/Stationery",
    "Cosmetics/Canteen",
    "Medicine",
    "Vehicle Maintenance",
    "Mob/Net/Dish",
    "LPG",
    "Elect Bill",
    "Clothing",
    "Insurance/SIP",
    "Other Expdr",
] as const;

/** Type derived from CATEGORIES for strict typing */
export type Category = (typeof CATEGORIES)[number];

/** Full month names */
export const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
] as const;

/** Short month names for tab labels */
export const MONTH_SHORT = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/** Current date defaults */
export const CURRENT_YEAR = new Date().getFullYear();
export const CURRENT_MONTH = new Date().getMonth(); // 0-indexed

/** Currency formatting – INR */
export const CURRENCY_LOCALE = "en-IN";
export const CURRENCY_CODE = "INR";
export const CURRENCY_SYMBOL = "₹";

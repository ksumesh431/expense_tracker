-- ============================================================
-- Expense Tracker – Supabase Schema (Fresh Start)
-- ============================================================
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This creates an optimized schema designed for:
--   • Fast monthly queries (indexed by date range)
--   • Upsert support (unique constraint on date + category)
--   • Efficient annual summaries (composite index)
--   • Scalability for many years of data
-- ============================================================

-- 1. Drop existing table if you want a clean slate
DROP TABLE IF EXISTS expenses CASCADE;

-- 2. Create the expenses table
CREATE TABLE expenses (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_date DATE        NOT NULL,
  category     TEXT        NOT NULL,
  amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  remarks      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Unique constraint: one entry per date + category (enables upsert)
ALTER TABLE expenses
  ADD CONSTRAINT uq_expense_date_category UNIQUE (expense_date, category);

-- 4. Performance indexes for common query patterns
-- Fast monthly lookups: "give me all expenses for March 2026"
CREATE INDEX idx_expenses_date ON expenses (expense_date);

-- Fast annual summaries: "give me category totals per month for 2026"
CREATE INDEX idx_expenses_year_category ON expenses (
  date_part('year', expense_date),
  category
);

-- Fast category filtering (if needed later)
CREATE INDEX idx_expenses_category ON expenses (category);

-- 5. Auto-update the updated_at timestamp on any row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 6. Enable Row Level Security (RLS) – recommended for Supabase
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Allow all for authenticated users"
  ON expenses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Also allow anon access (since you're using the anon key)
CREATE POLICY "Allow all for anon"
  ON expenses
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- DONE! Your schema is ready.
-- You can verify by running:  SELECT * FROM expenses LIMIT 10;
-- ============================================================

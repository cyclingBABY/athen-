-- ============================================
-- Migration 2: Fix all column mismatches for every admin function
-- ============================================
USE athena_1;

-- -----------------------------------------------
-- circulation_records:
-- App uses: checkout_date, due_date, return_date, renewed_count
-- Schema had: borrowed_at, returned_at (no due_date, no renewed_count)
-- -----------------------------------------------
ALTER TABLE circulation_records
  ADD COLUMN IF NOT EXISTS checkout_date  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS due_date       DATETIME      NULL,
  ADD COLUMN IF NOT EXISTS return_date    DATETIME      NULL,
  ADD COLUMN IF NOT EXISTS renewed_count  INT           NOT NULL DEFAULT 0;

-- Set default due_date = checkout_date + 14 days for any existing rows
UPDATE circulation_records SET checkout_date = borrowed_at WHERE checkout_date = '0000-00-00 00:00:00' OR checkout_date IS NULL;
UPDATE circulation_records SET due_date = DATE_ADD(checkout_date, INTERVAL 14 DAY) WHERE due_date IS NULL;
UPDATE circulation_records SET return_date = returned_at WHERE return_date IS NULL AND returned_at IS NOT NULL;

-- -----------------------------------------------
-- fines:
-- App uses: paid (bool), paid_date, amount, reason
-- Schema had: is_paid, fine_amount (name mismatch!)
-- Fix: add alias columns so both old and new code work
-- -----------------------------------------------
ALTER TABLE fines
  ADD COLUMN IF NOT EXISTS paid      TINYINT(1)    NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_date DATETIME      NULL,
  ADD COLUMN IF NOT EXISTS amount    DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Sync existing data from old columns to new columns
UPDATE fines SET paid = is_paid WHERE paid = 0 AND is_paid = 1;
UPDATE fines SET amount = fine_amount WHERE amount = 0 AND fine_amount > 0;

-- -----------------------------------------------
-- book_copies: ensure status enum includes all values the app uses
-- -----------------------------------------------
ALTER TABLE book_copies MODIFY COLUMN status VARCHAR(32) NOT NULL DEFAULT 'available';

-- -----------------------------------------------
-- profiles: ensure approved is TINYINT (boolean-friendly)
-- -----------------------------------------------
ALTER TABLE profiles MODIFY COLUMN approved TINYINT(1) NOT NULL DEFAULT 0;

SELECT 'Migration 2 complete!' AS status;

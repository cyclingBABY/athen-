-- ============================================
-- Migration: Add missing columns for Athena app
-- Run this in phpMyAdmin or via MySQL CLI
-- ============================================

USE athena_1;

-- -----------------------------------------------
-- books: add all missing columns
-- -----------------------------------------------
ALTER TABLE books
  ADD COLUMN IF NOT EXISTS author       VARCHAR(255)  NULL AFTER title,
  ADD COLUMN IF NOT EXISTS isbn         VARCHAR(64)   NULL,
  ADD COLUMN IF NOT EXISTS category     VARCHAR(100)  NULL DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS publish_year  INT(4)        NULL,
  ADD COLUMN IF NOT EXISTS total_copies  INT           NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS available_copies INT        NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS description  TEXT          NULL,
  ADD COLUMN IF NOT EXISTS cover_color  VARCHAR(64)   NULL DEFAULT 'hsl(210 60% 50%)',
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT        NULL,
  ADD COLUMN IF NOT EXISTS status       VARCHAR(32)   NOT NULL DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS barcode      VARCHAR(128)  NULL,
  ADD COLUMN IF NOT EXISTS shelf_location VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS digital_file_url TEXT       NULL,
  ADD COLUMN IF NOT EXISTS digital_file_type VARCHAR(32) NULL,
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- -----------------------------------------------
-- book_copies: add missing columns
-- -----------------------------------------------
ALTER TABLE book_copies
  ADD COLUMN IF NOT EXISTS copy_id      VARCHAR(64)   NULL,
  ADD COLUMN IF NOT EXISTS copy_number  INT           NULL,
  ADD COLUMN IF NOT EXISTS qr_code_url  TEXT          NULL,
  ADD COLUMN IF NOT EXISTS condition_notes TEXT        NULL,
  ADD COLUMN IF NOT EXISTS shelf_location VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- -----------------------------------------------
-- profiles: add any extra columns the app uses
-- -----------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone        VARCHAR(32)   NULL,
  ADD COLUMN IF NOT EXISTS address      TEXT          NULL,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE         NULL,
  ADD COLUMN IF NOT EXISTS gender       VARCHAR(16)   NULL,
  ADD COLUMN IF NOT EXISTS course       VARCHAR(255)  NULL,
  ADD COLUMN IF NOT EXISTS year_of_study INT          NULL,
  ADD COLUMN IF NOT EXISTS account_type VARCHAR(32)   NULL DEFAULT 'patron';

-- -----------------------------------------------
-- borrow_records: extra columns
-- -----------------------------------------------
ALTER TABLE borrow_records
  ADD COLUMN IF NOT EXISTS status       VARCHAR(32)   NOT NULL DEFAULT 'borrowed',
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- -----------------------------------------------
-- circulation_records: extra columns
-- -----------------------------------------------
ALTER TABLE circulation_records
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- -----------------------------------------------
-- reservations: extra columns
-- -----------------------------------------------
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS expires_at   DATETIME      NULL;

-- -----------------------------------------------
-- fines: extra columns
-- -----------------------------------------------
ALTER TABLE fines
  ADD COLUMN IF NOT EXISTS paid_at      DATETIME      NULL,
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- -----------------------------------------------
-- Delete the test insert that failed
-- (No-op if it doesn't exist)
-- -----------------------------------------------
DELETE FROM books WHERE title = 'Test Book' AND author IS NULL;

SELECT 'Migration complete!' AS status;

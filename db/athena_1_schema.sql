-- Athena project database schema for athena_1
-- Creates database tables used by the local PHP auth + query adapter.

-- Note: Adjust columns/types if your app expects additional fields.

-- Create DB if not exists
CREATE DATABASE IF NOT EXISTS athena_1
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE athena_1;

-- ----------------------------
-- Core auth tables
-- ----------------------------

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS profiles (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,

  -- common identity fields
  full_name VARCHAR(255) NULL,
  email VARCHAR(255) NULL,
  registration_number VARCHAR(255) NULL,

  -- approval/workflow
  approved TINYINT(1) NOT NULL DEFAULT 0,

  -- library card
  library_card_number VARCHAR(64) NULL,
  account_expires_at DATETIME NULL,

  -- optional avatar/photo
  photo_url TEXT NULL,

  -- fields used by lecturer registration
  department VARCHAR(255) NULL,

  -- shared optional field used by patron registration
  campus VARCHAR(255) NULL,

  -- links (for compatibility with app code that references staff_id/staff_id generation)
  staff_id VARCHAR(255) NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_profiles_user_id (user_id),
  UNIQUE KEY uq_profiles_library_card_number (library_card_number),

  CONSTRAINT fk_profiles_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_roles (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  role ENUM('admin','patron','lecturer') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_roles_user_id (user_id),

  CONSTRAINT fk_user_roles_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Minimal supporting tables
-- (So the rest of the app can load without immediate SQL errors)
-- ----------------------------

CREATE TABLE IF NOT EXISTS authors (
  id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_authors_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS books (
  id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  author_id CHAR(36) NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_books_author (author_id),

  CONSTRAINT fk_books_author
    FOREIGN KEY (author_id) REFERENCES authors (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS book_copies (
  id CHAR(36) NOT NULL,
  book_id CHAR(36) NOT NULL,
  copy_code VARCHAR(64) NULL,
  status ENUM('available','borrowed','lost','damaged') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_book_copies_book (book_id),

  CONSTRAINT fk_book_copies_book
    FOREIGN KEY (book_id) REFERENCES books (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Fines / circulation (referenced by relation map)
-- ----------------------------

CREATE TABLE IF NOT EXISTS circulation_records (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  book_id CHAR(36) NOT NULL,
  copy_id CHAR(36) NULL,
  status ENUM('borrowed','returned','cancelled') NOT NULL DEFAULT 'borrowed',
  borrowed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  returned_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_circulation_user (user_id),
  KEY idx_circulation_book (book_id),

  CONSTRAINT fk_circulation_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE,

  CONSTRAINT fk_circulation_book
    FOREIGN KEY (book_id) REFERENCES books (id)
    ON DELETE CASCADE,

  CONSTRAINT fk_circulation_copy
    FOREIGN KEY (copy_id) REFERENCES book_copies (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS borrow_records (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  book_id CHAR(36) NOT NULL,
  copy_id CHAR(36) NULL,
  borrowed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_at DATETIME NULL,
  returned_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),

  CONSTRAINT fk_borrow_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_borrow_book
    FOREIGN KEY (book_id) REFERENCES books (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fines (
  id CHAR(36) NOT NULL,
  circulation_id CHAR(36) NULL,
  user_id CHAR(36) NOT NULL,
  fine_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  reason VARCHAR(255) NULL,
  is_paid TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_fines_user (user_id),
  KEY idx_fines_circulation (circulation_id),

  CONSTRAINT fk_fines_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE,

  CONSTRAINT fk_fines_circulation
    FOREIGN KEY (circulation_id) REFERENCES circulation_records (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Reservations (referenced by relation map)
-- ----------------------------

CREATE TABLE IF NOT EXISTS reservations (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  book_id CHAR(36) NOT NULL,
  status ENUM('active','cancelled','fulfilled') NOT NULL DEFAULT 'active',
  reserved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),

  CONSTRAINT fk_res_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE,

  CONSTRAINT fk_res_book
    FOREIGN KEY (book_id) REFERENCES books (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Reading lists (referenced by relation map)
-- ----------------------------

CREATE TABLE IF NOT EXISTS course_reading_lists (
  id CHAR(36) NOT NULL,
  lecturer_id CHAR(36) NOT NULL,
  title VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),

  CONSTRAINT fk_crl_lecturer
    FOREIGN KEY (lecturer_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reading_list_items (
  id CHAR(36) NOT NULL,
  course_reading_list_id CHAR(36) NOT NULL,
  lecturer_id CHAR(36) NOT NULL,
  book_id CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),

  CONSTRAINT fk_rli_course
    FOREIGN KEY (course_reading_list_id) REFERENCES course_reading_lists (id)
    ON DELETE CASCADE,

  CONSTRAINT fk_rli_lecturer
    FOREIGN KEY (lecturer_id) REFERENCES users (id)
    ON DELETE CASCADE,

  CONSTRAINT fk_rli_book
    FOREIGN KEY (book_id) REFERENCES books (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Misc tables for barcode/ISBN stations (often referenced)
-- ----------------------------

CREATE TABLE IF NOT EXISTS transactions_log (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NULL,
  action VARCHAR(100) NOT NULL,
  meta JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),

  CONSTRAINT fk_tlog_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Seed initial admin accounts
-- Auth rule in api/auth.php:
--  - email 'stuartdonsms@gmail.com' => role 'admin' and approved=1
-- ----------------------------

-- NOTE: password_hash must be compatible with PHP password_hash(PASSWORD_BCRYPT).
-- The admin seed below uses a deterministic PASSWORD_BCRYPT hash for a known password.
-- If login fails, update the seed password below and re-run the SQL.
--
-- Seed password (plain-text) used to generate the hashes below:
-- admin123!


-- Insert admin user (stuartdonsms@gmail.com) with role admin
INSERT INTO users (id, email, password_hash)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'stuartdonsms@gmail.com',
   '$2y$10$w4yT5G0cGk2r1fE4vVw3e6nXxH3w6c8v1mJ5mQkYw9t5b8y9Jp9uO')
ON DUPLICATE KEY UPDATE email=email;

-- Profiles row for admin
INSERT INTO profiles (id, user_id, full_name, email, registration_number, approved, library_card_number, account_expires_at, photo_url, department, campus, staff_id)
VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', NULL, 'stuartdonsms@gmail.com', NULL, 1, 'ATH-ADM-00001', NULL, NULL, NULL, NULL, NULL)
ON DUPLICATE KEY UPDATE user_id=user_id;

-- Role row for admin
INSERT INTO user_roles (id, user_id, role)
VALUES
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', 'admin')
ON DUPLICATE KEY UPDATE role=role;

-- Insert admin user (code5_library) with role admin
INSERT INTO users (id, email, password_hash)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'code5_library',
   '$2y$10$w4yT5G0cGk2r1fE4vVw3e6nXxH3w6c8v1mJ5mQkYw9t5b8y9Jp9uO')
ON DUPLICATE KEY UPDATE email=email;

INSERT INTO profiles (id, user_id, full_name, email, registration_number, approved, library_card_number, account_expires_at, photo_url, department, campus, staff_id)
VALUES
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000002', NULL, 'code5_library', NULL, 1, 'ATH-ADM-00002', NULL, NULL, NULL, NULL, NULL)
ON DUPLICATE KEY UPDATE user_id=user_id;

INSERT INTO user_roles (id, user_id, role)
VALUES
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000002', 'admin')
ON DUPLICATE KEY UPDATE role=role;

-- End of schema



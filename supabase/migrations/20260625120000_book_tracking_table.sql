-- Book Tracking (double-tick)
-- Creates `book_trackings` table for admin-managed physical borrow/return tracking.

CREATE TABLE IF NOT EXISTS book_trackings (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  book_id CHAR(36) NOT NULL,
  borrowed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  returned_at DATETIME NULL,
  status ENUM('borrowed','returned') NOT NULL DEFAULT 'borrowed',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_bt_user (user_id),
  KEY idx_bt_book (book_id),

  CONSTRAINT fk_bt_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE,

  CONSTRAINT fk_bt_book
    FOREIGN KEY (book_id) REFERENCES books (id)
    ON DELETE CASCADE
);


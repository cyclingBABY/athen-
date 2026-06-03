-- Athena project database bootstrap
-- Create database: athena_1

CREATE DATABASE IF NOT EXISTS athena_1
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Optional (local XAMPP): grant privileges to root
-- (Run only if you need privileges; typically root already has access)
-- GRANT ALL PRIVILEGES ON athena_1.* TO 'root'@'localhost';
-- FLUSH PRIVILEGES;


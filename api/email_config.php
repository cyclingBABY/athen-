<?php
// ============================================
// Email / SMTP Configuration
// api/email_config.php
// ============================================
// IMPORTANT: If login fails with your regular password,
// Google requires an App Password:
//   1. Go to https://myaccount.google.com/security
//   2. Enable 2-Step Verification
//   3. Search "App Passwords" → generate one for "Mail"
//   4. Paste the 16-character code as SMTP_PASSWORD below
// ============================================

define('SMTP_HOST',     'smtp.gmail.com');
define('SMTP_PORT',     587);
define('SMTP_SECURE',   'tls');
define('SMTP_USERNAME', 'stuartdonsms@gmail.com');
define('SMTP_PASSWORD', 'ntiaybnqzkthfssh');   // Gmail App Password
define('SMTP_FROM',     'stuartdonsms@gmail.com');
define('SMTP_FROM_NAME','Athena Library System');

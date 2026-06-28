<?php
// ============================================
// Edge Functions API Endpoint
// api/functions.php
// ============================================

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/SmtpMailer.php';
require_once __DIR__ . '/email_config.php';

$rawBody = file_get_contents('php://input');
$body = json_decode($rawBody, true) ?: [];

$name = isset($body['name']) ? $body['name'] : '';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit();
}

if (!$name) {
    http_response_code(400);
    echo json_encode(["error" => "Function name is required"]);
    exit();
}

// ── Helper: send email via SMTP ─────────────────────────────────────────
function sendEmail(string $toEmail, string $toName, string $subject, string $html): array {
    try {
        $mailer = new SmtpMailer(
            SMTP_HOST,
            SMTP_PORT,
            SMTP_SECURE,
            SMTP_USERNAME,
            SMTP_PASSWORD,
            SMTP_FROM,
            SMTP_FROM_NAME
        );
        $recipients = $toName ? [$toEmail => $toName] : $toEmail;
        $mailer->send($recipients, $subject, $html);
        return ['sent' => true, 'error' => null];
    } catch (Exception $e) {
        // Log the error but don't crash — account was already created
        error_log("[Athena Mailer] " . $e->getMessage());
        return ['sent' => false, 'error' => $e->getMessage()];
    }
}

// ── Email Templates ──────────────────────────────────────────────────────
function lecturerInviteHtml(string $fullName, string $email, string $tempPassword, string $cardNumber, string $department): string {
    $name     = htmlspecialchars($fullName ?: 'Lecturer');
    $dept     = $department ? "<p style='margin:4px 0;color:#6b7280;'>Department: <strong>" . htmlspecialchars($department) . "</strong></p>" : '';
    $appUrl   = defined('APP_URL') ? APP_URL : "http://localhost/athen-/dist/";
    return <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:36px 40px;">
          <h1 style="margin:0;color:#fff;font-size:24px;letter-spacing:-.5px;">📚 Athena Library System</h1>
          <p style="margin:6px 0 0;color:#93c5fd;font-size:14px;">You've been added as a Lecturer</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 16px;color:#111827;font-size:16px;">Hello, <strong>{$name}</strong>!</p>
          <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;">
            Your lecturer account has been created on the Athena Library System.
            Use the credentials below to sign in for the first time.
          </p>

          <!-- Credentials box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;border:1px solid #c7d7fe;border-radius:8px;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 12px;color:#1e40af;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:.5px;">Your Login Credentials</p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:4px 0;color:#6b7280;font-size:13px;width:130px;">Email / Username:</td>
                  <td style="padding:4px 0;color:#111827;font-size:13px;font-weight:600;">{$email}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:#6b7280;font-size:13px;">Temporary Password:</td>
                  <td style="padding:4px 0;font-size:14px;font-family:monospace;font-weight:700;color:#dc2626;letter-spacing:1px;">{$tempPassword}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:#6b7280;font-size:13px;">Library Card:</td>
                  <td style="padding:4px 0;color:#111827;font-size:13px;font-family:monospace;">{$cardNumber}</td>
                </tr>
              </table>
              {$dept}
            </td></tr>
          </table>

          <!-- CTA -->
          <p style="text-align:center;margin:0 0 24px;">
            <a href="{$appUrl}" style="display:inline-block;padding:12px 32px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Sign In to Athena →</a>
          </p>

          <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
            ⚠️ Please change your password after your first login.<br>
            This is an automated message from Athena Library System. Do not reply to this email.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
            Athena Library System &nbsp;·&nbsp; Powered by code5 @stuart swafa projects
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
HTML;
}

function approvalEmailHtml(string $fullName): string {
    $name   = htmlspecialchars($fullName ?: 'User');
    $appUrl = defined('APP_URL') ? APP_URL : "http://localhost/athen-/dist/";
    return <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <tr><td style="background:linear-gradient(135deg,#064e3b,#10b981);padding:36px 40px;">
          <h1 style="margin:0;color:#fff;font-size:24px;">📚 Athena Library System</h1>
          <p style="margin:6px 0 0;color:#a7f3d0;font-size:14px;">Your account has been approved!</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 16px;color:#111827;font-size:16px;">Hello, <strong>{$name}</strong>!</p>
          <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;">
            Great news — your library account has been reviewed and <strong>approved</strong> by the administrator.
            You can now sign in and access all library services.
          </p>
          <p style="text-align:center;margin:0 0 24px;">
            <a href="{$appUrl}" style="display:inline-block;padding:12px 32px;background:#10b981;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Sign In Now →</a>
          </p>
          <p style="margin:0;color:#9ca3af;font-size:12px;">This is an automated message. Do not reply.</p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">Athena Library System</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
HTML;
}

function userInviteHtml(string $fullName, string $email, string $password, string $role): string {
    $name    = htmlspecialchars($fullName ?: 'User');
    $roleLabel = ucfirst($role === 'admin' ? 'Administrator' : 'Library Member');
    $appUrl  = defined('APP_URL') ? APP_URL : "http://localhost/athen-/dist/";
    $accent  = $role === 'admin' ? '#7c3aed' : '#2563eb';
    $roleIcon = $role === 'admin' ? '🛡️' : '📚';
    return <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1e3a5f,{$accent});padding:36px 40px;">
          <h1 style="margin:0;color:#fff;font-size:24px;letter-spacing:-.5px;">📚 Athena Library System</h1>
          <p style="margin:6px 0 0;color:#bfdbfe;font-size:14px;">{$roleIcon} You've been added as a {$roleLabel}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 16px;color:#111827;font-size:16px;">Hello, <strong>{$name}</strong>!</p>
          <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;">
            Your account has been created and approved on the Athena Library System.
            Use the credentials below to sign in.
          </p>

          <!-- Credentials box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;border:1px solid #c7d7fe;border-radius:8px;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 12px;color:#1e40af;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:.5px;">Your Login Credentials</p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:4px 0;color:#6b7280;font-size:13px;width:130px;">Email:</td>
                  <td style="padding:4px 0;color:#111827;font-size:13px;font-weight:600;">{$email}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:#6b7280;font-size:13px;">Password:</td>
                  <td style="padding:4px 0;font-size:14px;font-family:monospace;font-weight:700;color:#dc2626;letter-spacing:1px;">{$password}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:#6b7280;font-size:13px;">Role:</td>
                  <td style="padding:4px 0;color:#111827;font-size:13px;">{$roleIcon} {$roleLabel}</td>
                </tr>
              </table>
            </td></tr>
          </table>

          <!-- CTA -->
          <p style="text-align:center;margin:0 0 24px;">
            <a href="{$appUrl}" style="display:inline-block;padding:12px 32px;background:{$accent};color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Sign In to Athena →</a>
          </p>

          <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
            ⚠️ Please change your password after your first login.<br>
            This is an automated message from Athena Library System. Do not reply.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
            Athena Library System &nbsp;·&nbsp; Powered by code5 @stuart swafa projects
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
HTML;
}

// ── Route handlers ───────────────────────────────────────────────────────
try {
    // ── create-lecturer ─────────────────────────────────────────────────
    if ($name === 'create-lecturer') {
        $email      = isset($body['email'])      ? trim($body['email'])      : '';
        $fullName   = isset($body['fullName'])   ? trim($body['fullName'])   : '';
        $department = isset($body['department']) ? trim($body['department']) : '';
        $staffId    = isset($body['staffId'])    ? trim($body['staffId'])    : '';

        if (!$email) {
            http_response_code(400);
            echo json_encode(["error" => "Email is required"]);
            exit();
        }

        // Generate temporary password
        $tempPassword = "Athena" . substr(str_shuffle("0123456789abcdefghijklmnopqrstuvwxyz"), 0, 8) . "!";

        // Check if user already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(["error" => "User already registered"]);
            exit();
        }

        // Generate UUIDs
        $userId    = guidv4();
        $profileId = guidv4();
        $roleId    = guidv4();

        // 6-year expiry for lecturers
        $expiresAt = date('Y-m-d H:i:s', strtotime("+6 years"));

        // Sequential library card number
        $countStmt   = $pdo->query("SELECT COUNT(*) FROM profiles");
        $seq         = $countStmt->fetchColumn() + 1;
        $card_number = 'ATH-STF-' . str_pad($seq, 5, '0', STR_PAD_LEFT);

        // Hash password
        $passwordHash = password_hash($tempPassword, PASSWORD_BCRYPT);

        // DB transaction
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)");
        $stmt->execute([$userId, $email, $passwordHash]);

        $stmt = $pdo->prepare("
            INSERT INTO profiles (id, user_id, full_name, email, department, staff_id, approved, library_card_number, account_expires_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
        ");
        $stmt->execute([$profileId, $userId, $fullName, $email, $department, $staffId, $card_number, $expiresAt]);

        $stmt = $pdo->prepare("INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'lecturer')");
        $stmt->execute([$roleId, $userId]);

        $pdo->commit();

        // ── Send invitation email ─────────────────────────────────────
        $subject  = "Your Athena Library Lecturer Account — Login Details";
        $html     = lecturerInviteHtml($fullName, $email, $tempPassword, $card_number, $department);
        $mailResult = sendEmail($email, $fullName, $subject, $html);

        // Always log to file as backup
        $logFile    = __DIR__ . '/lecturer_invites.txt';
        $logMessage = "Date: " . date('Y-m-d H:i:s') . "\nEmail: $email\nTemporary Password: $tempPassword\nFullName: $fullName\nDepartment: $department\nStaff ID: $staffId\nCard Number: $card_number\nEmail Sent: " . ($mailResult['sent'] ? 'YES' : 'NO — ' . $mailResult['error']) . "\n---------------------------------\n";
        file_put_contents($logFile, $logMessage, FILE_APPEND);

        $message = $mailResult['sent']
            ? "Lecturer account created and invitation email sent to {$email}."
            : "Lecturer account created. Email delivery failed: " . $mailResult['error'] . ". Credentials saved to lecturer_invites.txt.";

        echo json_encode([
            "success"    => true,
            "emailSent"  => $mailResult['sent'],
            "message"    => $message
        ]);
        exit();

    // ── send-approval-email ──────────────────────────────────────────────
    } elseif ($name === 'send-approval-email') {
        $email    = isset($body['email'])    ? trim($body['email'])    : '';
        $fullName = isset($body['fullName']) ? trim($body['fullName']) : '';

        $emailSent = false;
        if ($email) {
            $subject    = "Your Athena Library Account Has Been Approved!";
            $html       = approvalEmailHtml($fullName);
            $mailResult = sendEmail($email, $fullName, $subject, $html);
            $emailSent  = $mailResult['sent'];
        }

        $logFile    = __DIR__ . '/email_approvals.txt';
        $logMessage = "Date: " . date('Y-m-d H:i:s') . "\nRecipient: $email ($fullName)\nEmail Sent: " . ($emailSent ? 'YES' : 'NO') . "\n---------------------------------\n";
        file_put_contents($logFile, $logMessage, FILE_APPEND);

        echo json_encode([
            "success"   => true,
            "emailSent" => $emailSent,
            "message"   => $emailSent ? "Approval email sent to {$email}." : "Approval logged (email not sent)."
        ]);
        exit();

    // ── send-user-invite ─────────────────────────────────────────────────
    } elseif ($name === 'send-user-invite') {
        $email    = isset($body['email'])    ? trim($body['email'])    : '';
        $fullName = isset($body['fullName']) ? trim($body['fullName']) : '';
        $password = isset($body['password']) ? $body['password']       : '';
        $role     = isset($body['role'])     ? $body['role']           : 'patron';

        if (!$email) {
            http_response_code(400);
            echo json_encode(["error" => "Email is required"]);
            exit();
        }

        $subject    = "Welcome to Athena Library System — Your Account Details";
        $html       = userInviteHtml($fullName, $email, $password, $role);
        $mailResult = sendEmail($email, $fullName, $subject, $html);

        // Log as backup
        $logFile    = __DIR__ . '/user_invites.txt';
        $logMessage = "Date: " . date('Y-m-d H:i:s') . "\nEmail: $email\nName: $fullName\nRole: $role\nEmail Sent: " . ($mailResult['sent'] ? 'YES' : 'NO — ' . $mailResult['error']) . "\n---------------------------------\n";
        file_put_contents($logFile, $logMessage, FILE_APPEND);

        echo json_encode([
            "success"   => true,
            "emailSent" => $mailResult['sent'],
            "message"   => $mailResult['sent']
                ? "Invitation email sent to {$email}."
                : "Email failed: " . $mailResult['error']
        ]);
        exit();

    } else {
        http_response_code(400);
        echo json_encode(["error" => "Function not implemented: " . $name]);
        exit();
    }

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
    exit();
}

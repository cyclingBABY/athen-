<?php
// ============================================
// Simulated Edge Functions API Endpoint
// api/functions.php
// ============================================

require_once __DIR__ . '/config.php';

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

try {
    if ($name === 'create-lecturer') {
        $email = isset($body['email']) ? trim($body['email']) : '';
        $fullName = isset($body['fullName']) ? trim($body['fullName']) : '';
        $department = isset($body['department']) ? trim($body['department']) : '';
        $staffId = isset($body['staffId']) ? trim($body['staffId']) : '';

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

        // Generate standard UUIDs
        $userId = guidv4();
        $profileId = guidv4();
        $roleId = guidv4();

        // 6 years expiration date for lecturers
        $expiresAt = date('Y-m-d H:i:s', strtotime("+6 years"));

        // Generate sequential library card number for staff/lecturer
        $countStmt = $pdo->query("SELECT COUNT(*) FROM profiles");
        $seq = $countStmt->fetchColumn() + 1;
        $card_number = 'ATH-STF-' . str_pad($seq, 5, '0', STR_PAD_LEFT);

        // Password hash
        $passwordHash = password_hash($tempPassword, PASSWORD_BCRYPT);

        // Begin transaction
        $pdo->beginTransaction();

        // 1. Insert into users
        $stmt = $pdo->prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)");
        $stmt->execute([$userId, $email, $passwordHash]);

        // 2. Insert into profiles (pre-approved)
        $stmt = $pdo->prepare("
            INSERT INTO profiles (id, user_id, full_name, email, department, staff_id, approved, library_card_number, account_expires_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
        ");
        $stmt->execute([$profileId, $userId, $fullName, $email, $department, $staffId, $card_number, $expiresAt]);

        // 3. Insert into user_roles
        $stmt = $pdo->prepare("INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'lecturer')");
        $stmt->execute([$roleId, $userId]);

        $pdo->commit();

        // Log the credentials to a local temp log file for easy teacher/developer viewing
        $logFile = __DIR__ . '/lecturer_invites.txt';
        $logMessage = "Date: " . date('Y-m-d H:i:s') . "\nEmail: $email\nTemporary Password: $tempPassword\nFullName: $fullName\nDepartment: $department\nStaff ID: $staffId\nCard Number: $card_number\n---------------------------------\n";
        file_put_contents($logFile, $logMessage, FILE_APPEND);

        echo json_encode([
            "success" => true,
            "message" => "Lecturer created and invitation saved. (Temporary password: $tempPassword)"
        ]);
        exit();

    } else if ($name === 'send-approval-email') {
        $email = isset($body['email']) ? trim($body['email']) : '';
        $fullName = isset($body['fullName']) ? trim($body['fullName']) : '';

        // Simply log the approval or mock it
        $logFile = __DIR__ . '/email_approvals.txt';
        $logMessage = "Date: " . date('Y-m-d H:i:s') . "\nRecipient: $email ($fullName)\nSubject: Account Approved!\nMessage: Your account has been reviewed and approved by the administrator. You can now login.\n---------------------------------\n";
        file_put_contents($logFile, $logMessage, FILE_APPEND);

        echo json_encode([
            "success" => true,
            "message" => "Approval email simulated and logged successfully."
        ]);
        exit();

    } else {
        http_response_code(400);
        echo json_encode(["error" => "Simulated edge function not implemented: " . $name]);
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

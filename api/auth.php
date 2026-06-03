<?php
// ============================================
// Authentication API Endpoint
// api/auth.php
// ============================================

require_once __DIR__ . '/config.php';

$rawBody = file_get_contents('php://input');
$body = json_decode($rawBody, true) ?: [];

$action = isset($body['action']) ? $body['action'] : '';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit();
}

try {
    if ($action === 'signUp') {
        $email = isset($body['email']) ? trim($body['email']) : '';
        $password = isset($body['password']) ? $body['password'] : '';
        $metadata = isset($body['metadata']) ? $body['metadata'] : [];

        if (!$email || !$password) {
            http_response_code(400);
            echo json_encode(["error" => "Email and password are required"]);
            exit();
        }

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

        // Determine Role
        // Admins are identified by email in this deployment.
        $role = 'patron';
        if ($email === 'stuartdonsms@gmail.com') {
            $role = 'admin';
        } else if (isset($metadata['account_type']) && $metadata['account_type'] === 'lecturer') {
            $role = 'lecturer';
        }

        // Auto Approval logic (admins should be approved immediately)
        $approved = ($email === 'stuartdonsms@gmail.com') ? 1 : 0;

        // Debug log for admin creation/approval
        file_put_contents(__DIR__ . '/auth_debug.log',
            date('Y-m-d H:i:s') . "\n" .
            "SIGNUP email={$email} role={$role} approved={$approved} userId={$userId}\n" .
            "---------------------------------\n",
            FILE_APPEND
        );



        // Generate library card number sequentially
        $countStmt = $pdo->query("SELECT COUNT(*) FROM profiles");
        $seq = $countStmt->fetchColumn() + 1;
        $suffix = str_pad($seq, 5, '0', STR_PAD_LEFT);
        if ($role === 'admin') {
            $card_number = 'ATH-ADM-' . $suffix;
        } else if ($role === 'lecturer') {
            $card_number = 'ATH-STF-' . $suffix;
        } else {
            $card_number = 'ATH-STD-' . $suffix;
        }

        // Expiration dates
        $expiresAt = null;
        if ($email !== 'stuartdonsms@gmail.com') {
            $years = ($role === 'lecturer') ? 6 : 4;
            $expiresAt = date('Y-m-d H:i:s', strtotime("+$years years"));
        }

        // Password hash
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);

        // Begin Transaction
        $pdo->beginTransaction();

        // 1. Insert into users
        $stmt = $pdo->prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)");
        $stmt->execute([$userId, $email, $passwordHash]);

        // 2. Insert into profiles
        $fullName = isset($metadata['full_name']) ? $metadata['full_name'] : '';
        $regNumber = isset($metadata['registration_number']) ? $metadata['registration_number'] : '';
        
        $stmt = $pdo->prepare("
            INSERT INTO profiles (id, user_id, full_name, email, registration_number, approved, library_card_number, account_expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$profileId, $userId, $fullName, $email, $regNumber, $approved, $card_number, $expiresAt]);

        // 3. Insert into user_roles
        $stmt = $pdo->prepare("INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)");
        $stmt->execute([$roleId, $userId, $role]);

        $pdo->commit();

        echo json_encode([
            "success" => true,
            "user" => [
                "id" => $userId,
                "email" => $email,
                "user_metadata" => [
                    "full_name" => $fullName,
                    "registration_number" => $regNumber
                ]
            ]
        ]);
        exit();

    } else if ($action === 'signInWithPassword') {
        $email = isset($body['email']) ? trim($body['email']) : '';
        $password = isset($body['password']) ? $body['password'] : '';

        if (!$email || !$password) {
            http_response_code(400);
            echo json_encode(["error" => "Email and password are required"]);
            exit();
        }

        // Select user
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid login credentials"]);
            exit();
        }

        // Get profile metadata
        $stmt = $pdo->prepare("SELECT * FROM profiles WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $profile = $stmt->fetch() ?: [];

        // Debug log for login attempts
        file_put_contents(__DIR__ . '/auth_debug.log',
            date('Y-m-d H:i:s') . "\n" .
            "SIGNIN email={$email} userId={$user['id']}\n" .
            "---------------------------------\n",
            FILE_APPEND
        );

        echo json_encode([
            "session" => [

                "access_token" => $user['id'], // Use the user's UUID directly as token in this local setup
                "user" => [
                    "id" => $user['id'],
                    "email" => $user['email'],
                    "user_metadata" => [
                        "full_name" => isset($profile['full_name']) ? $profile['full_name'] : '',
                        "registration_number" => isset($profile['registration_number']) ? $profile['registration_number'] : '',
                        "photo_url" => isset($profile['photo_url']) ? $profile['photo_url'] : ''
                    ]
                ]
            ]
        ]);
        exit();

    } else if ($action === 'signOut') {
        echo json_encode(["success" => true]);
        exit();
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Invalid auth action"]);
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

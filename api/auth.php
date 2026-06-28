<?php
// api/auth.php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit();
}

$rawBody = file_get_contents('php://input');
$body = json_decode($rawBody, true) ?: [];
$action = isset($body['action']) ? $body['action'] : '';
$metadata = isset($body['metadata']) && is_array($body['metadata']) ? $body['metadata'] : [];

function authUserPayload($user, $profile = []) {
    return [
        "id" => $user['id'],
        "email" => $user['email'],
        "user_metadata" => [
            "full_name" => isset($profile['full_name']) ? $profile['full_name'] : '',
            "registration_number" => isset($profile['registration_number']) ? $profile['registration_number'] : '',
            "photo_url" => isset($profile['photo_url']) ? $profile['photo_url'] : ''
        ]
    ];
}

try {
    if ($action === 'login' || $action === 'signInWithPassword') {
        $email = isset($body['email']) ? trim($body['email']) : '';
        $password = isset($body['password']) ? $body['password'] : '';

        if (!$email || !$password) {
            http_response_code(400);
            echo json_encode(["error" => "Email and password are required"]);
            exit();
        }

        $stmt = $pdo->prepare("
            SELECT u.*, r.role
            FROM users u
            LEFT JOIN user_roles r ON u.id = r.user_id
            WHERE u.email = :email
            LIMIT 1
        ");
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(["error" => "Invalid email or password"]);
            exit();
        }

        $profileStmt = $pdo->prepare("SELECT * FROM profiles WHERE user_id = :user_id LIMIT 1");
        $profileStmt->execute(['user_id' => $user['id']]);
        $profile = $profileStmt->fetch() ?: [];
        $userPayload = authUserPayload($user, $profile);
        $role = $user['role'] ?: 'patron';
        $session = [
            "access_token" => $user['id'],
            "user" => $userPayload
        ];

        echo json_encode([
            "token" => $user['id'],
            "user" => $userPayload,
            "role" => $role,
            "session" => $session
        ]);
        exit();
    }

    if ($action === 'register' || $action === 'signUp') {
        $email = isset($body['email']) ? trim($body['email']) : '';
        $password = isset($body['password']) ? $body['password'] : '';
        $fullName = isset($body['full_name']) ? trim($body['full_name']) : (isset($metadata['full_name']) ? trim($metadata['full_name']) : '');
        $regNum = isset($body['registration_number']) ? trim($body['registration_number']) : (isset($metadata['registration_number']) ? trim($metadata['registration_number']) : '');
        $accountType = isset($body['account_type']) ? $body['account_type'] : (isset($metadata['account_type']) ? $metadata['account_type'] : 'patron');
        $role = in_array($accountType, ['admin', 'patron', 'lecturer', 'registrar', 'staff']) ? $accountType : 'patron';

        if ($email === 'stuartdonsms@gmail.com' || $email === 'stuartdonsos@gmail.com' || $email === 'code5_library') {
            $role = 'admin';
        }

        if (!$email || !$password) {
            http_response_code(400);
            echo json_encode(["error" => "Email and password are required"]);
            exit();
        }

        $existingStmt = $pdo->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
        $existingStmt->execute(['email' => $email]);
        if ($existingStmt->fetch()) {
            http_response_code(400);
            echo json_encode(["error" => "User already registered"]);
            exit();
        }

        $countStmt = $pdo->query("SELECT COUNT(*) FROM profiles");
        $seq = intval($countStmt->fetchColumn()) + 1;
        $suffix = str_pad((string) $seq, 5, '0', STR_PAD_LEFT);
        
        $cardPrefix = 'ATH-STD-';
        if ($role === 'admin') $cardPrefix = 'ATH-ADM-';
        elseif ($role === 'registrar') $cardPrefix = 'ATH-REG-';
        elseif ($role === 'staff' || $role === 'lecturer') $cardPrefix = 'ATH-STF-';
        
        $libraryCardNumber = $cardPrefix . $suffix;
        $approved = $role === 'admin' ? 1 : 0;
        $expiresAt = $role === 'admin' ? null : date('Y-m-d H:i:s', strtotime(($role === 'lecturer' || $role === 'staff' || $role === 'registrar') ? '+6 years' : '+4 years'));

        $userId = guidv4();
        $profileId = guidv4();
        $roleId = guidv4();
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

        $pdo->beginTransaction();

        $stmt = $pdo->prepare("INSERT INTO users (id, email, password_hash) VALUES (:id, :email, :pass)");
        $stmt->execute(['id' => $userId, 'email' => $email, 'pass' => $hashedPassword]);

        $stmt = $pdo->prepare("
            INSERT INTO profiles (id, user_id, full_name, email, registration_number, approved, library_card_number, account_expires_at)
            VALUES (:id, :uid, :name, :email, :reg, :approved, :card, :expires)
        ");
        $stmt->execute([
            'id' => $profileId,
            'uid' => $userId,
            'name' => $fullName,
            'email' => $email,
            'reg' => $regNum,
            'approved' => $approved,
            'card' => $libraryCardNumber,
            'expires' => $expiresAt
        ]);

        $stmt = $pdo->prepare("INSERT INTO user_roles (id, user_id, role) VALUES (:id, :uid, :role)");
        $stmt->execute(['id' => $roleId, 'uid' => $userId, 'role' => $role]);

        $pdo->commit();

        echo json_encode([
            "user" => [
                "id" => $userId,
                "email" => $email,
                "user_metadata" => [
                    "full_name" => $fullName,
                    "registration_number" => $regNum
                ]
            ],
            "role" => $role
        ]);
        exit();
    }

    if ($action === 'signOut') {
        echo json_encode(["success" => true]);
        exit();
    }

    if ($action === 'changePassword') {
        $userId = isset($body['userId']) ? trim($body['userId']) : '';
        $newPassword = isset($body['password']) ? $body['password'] : '';

        if (!$userId || !$newPassword) {
            http_response_code(400);
            echo json_encode(["error" => "User ID and new password are required"]);
            exit();
        }

        if (strlen($newPassword) < 6) {
            http_response_code(400);
            echo json_encode(["error" => "Password must be at least 6 characters"]);
            exit();
        }

        $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("UPDATE users SET password_hash = :pass WHERE id = :id");
        $stmt->execute(['pass' => $hashedPassword, 'id' => $userId]);

        echo json_encode(["success" => true, "message" => "Password updated successfully"]);
        exit();
    }

    http_response_code(400);
    echo json_encode(["error" => "Invalid auth action"]);
    exit();
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
    exit();
}

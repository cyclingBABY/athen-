<?php
// ============================================
// File Storage Upload API
// api/storage.php
// ============================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit();
}

$bucket = isset($_POST['bucket']) ? $_POST['bucket'] : '';
$path = isset($_POST['path']) ? $_POST['path'] : '';

if (!$bucket || !$path || !isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing required upload parameters"]);
    exit();
}

// 1. Sanitize Bucket Name (strictly alphanumeric, dashes, and underscores)
$bucket = preg_replace('/[^a-zA-Z0-9_-]/', '', $bucket);

// 2. Sanitize Path Slashes (prevent directory traversal exploits)
$pathParts = explode('/', $path);
$sanitizedPathParts = array_map(function($p) {
    return preg_replace('/[^a-zA-Z0-9_.-]/', '', $p);
}, $pathParts);
$path = implode('/', $sanitizedPathParts);

// 3. Create target uploads directory layout dynamically
$uploadsBaseDir = __DIR__ . "/uploads/" . $bucket;
$targetDir = $uploadsBaseDir . "/" . dirname($path);

if (!is_dir($targetDir)) {
    mkdir($targetDir, 0777, true);
}

$targetFile = $uploadsBaseDir . "/" . $path;

// 4. Save and return success or failure response
if (move_uploaded_file($_FILES['file']['tmp_name'], $targetFile)) {
    echo json_encode([
        "data" => [
            "path" => $path
        ]
    ]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Failed to save uploaded file to local filesystem"]);
}

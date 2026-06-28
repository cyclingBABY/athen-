<?php
// api/storage.php
// Handles file uploads to local storage (simulates Supabase storage)

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit();
}

$bucket = isset($_POST['bucket']) ? preg_replace('/[^a-zA-Z0-9_\-]/', '', $_POST['bucket']) : 'default';
$path   = isset($_POST['path']) ? $_POST['path'] : '';

// Sanitize path segments to prevent directory traversal
$path = str_replace(['..', '\\'], '', $path);
$path = ltrim($path, '/');

if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(["error" => "No file uploaded"]);
    exit();
}

$uploadDir = __DIR__ . '/uploads/' . $bucket . '/';
$pathDir   = $uploadDir . dirname($path) . '/';

// Create directory recursively
if (!is_dir($pathDir)) {
    if (!mkdir($pathDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(["error" => "Could not create upload directory"]);
        exit();
    }
}

$tmpFile  = $_FILES['file']['tmp_name'];
$destFile = $uploadDir . $path;

// Validate MIME type — images, documents (all formats), audio, and video
$allowedMimes = [
    // ── Images ──────────────────────────────────────────────────────────
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'image/svg+xml', 'image/bmp', 'image/tiff',

    // ── Word Processing ──────────────────────────────────────────────────
    'application/msword',                                                    // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.oasis.opendocument.text',                               // .odt
    'application/x-iwork-pages-sffpages',                                    // .pages
    'application/vnd.apple.pages',                                           // .pages (alt)
    'application/rtf', 'text/rtf',                                           // .rtf
    'text/plain',                                                             // .txt
    'text/markdown', 'text/x-markdown',                                      // .md

    // ── Fixed Layouts & E-Books ──────────────────────────────────────────
    'application/pdf',                                                        // .pdf
    'application/epub+zip',                                                   // .epub
    'application/x-mobipocket-ebook', 'application/vnd.amazon.mobi8-ebook',  // .mobi
    'application/x-mobi8-ebook',
    'application/vnd.ms-xpsdocument',                                         // .xps
    'application/oxps',                                                        // .xps (alt)

    // ── Spreadsheets ─────────────────────────────────────────────────────
    'application/vnd.ms-excel',                                               // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',      // .xlsx
    'application/vnd.oasis.opendocument.spreadsheet',                         // .ods
    'application/x-iwork-numbers-sffnumbers',                                 // .numbers
    'application/vnd.apple.numbers',                                          // .numbers (alt)
    'text/csv', 'application/csv',                                            // .csv

    // ── Presentations ────────────────────────────────────────────────────
    'application/vnd.ms-powerpoint',                                          // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/vnd.openxmlformats-officedocument.presentationml.slideshow',    // .ppsx
    'application/vnd.oasis.opendocument.presentation',                        // .odp
    'application/x-iwork-keynote-sffkey',                                     // .key
    'application/vnd.apple.keynote',                                          // .key (alt)

    // ── Audio ────────────────────────────────────────────────────────────
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/vnd.wave',
    'audio/ogg', 'audio/flac', 'audio/x-flac', 'audio/aac', 'audio/x-aac',
    'audio/mp4', 'audio/x-m4a', 'audio/x-ms-wma', 'audio/webm',
    'audio/opus', 'audio/amr', 'audio/3gpp', 'audio/aiff', 'audio/x-aiff',
    'audio/x-realaudio',

    // ── Video ────────────────────────────────────────────────────────────
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',

    // ── Generic binary (fallback for uncommon MIME reporters) ────────────
    'application/octet-stream', 'application/zip',
];
$finfo    = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($tmpFile);

// Extension-based fallback — handles OS/browser MIME inconsistencies
$ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
$allowedExtensions = [
    // Images
    'jpg','jpeg','png','gif','webp','svg','bmp','tiff',
    // Word processing
    'doc','docx','odt','pages','rtf','txt','md','markdown',
    // Fixed layouts & e-books
    'pdf','epub','mobi','xps','oxps',
    // Spreadsheets
    'xls','xlsx','ods','numbers','csv',
    // Presentations
    'ppt','pptx','odp','key','ppsx','pps',
    // Audio
    'mp3','wav','ogg','flac','aac','m4a','wma','opus','amr','aiff','ra','3gp','webm',
    // Video
    'mp4','mov','avi','mkv',
];

if (!in_array($mimeType, $allowedMimes) && !in_array($ext, $allowedExtensions)) {
    http_response_code(415);
    echo json_encode(["error" => "File type not allowed: " . $mimeType . " (." . $ext . ")"]);
    exit();
}

if (!move_uploaded_file($tmpFile, $destFile)) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to save uploaded file"]);
    exit();
}

echo json_encode([
    "data" => ["path" => $path],
    "error" => null
]);
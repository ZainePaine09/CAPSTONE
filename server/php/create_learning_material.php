<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$token = trim($_POST['token'] ?? '');
$title = trim($_POST['title'] ?? '');
$category = trim($_POST['category'] ?? '');
$targetProgram = trim($_POST['targetProgram'] ?? 'all');
$description = trim($_POST['description'] ?? '');
$link = trim($_POST['link'] ?? '');

if ($token === '' || $title === '' || $category === '' || $description === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'token, title, category, and description are required']);
    exit;
}

$targetProgram = strtolower(trim($targetProgram));
if ($targetProgram === '') {
    $targetProgram = 'all';
}

if (!in_array($targetProgram, ['all', 'bsit', 'bscs', 'bsce', 'bsba'], true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid target program']);
    exit;
}

if ($link === '') {
    $link = null;
} elseif (!filter_var($link, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid resource link']);
    exit;
}

try {
    $tokenStmt = $pdo->prepare('SELECT email, type FROM tokens WHERE token = ? AND expires_at > NOW() LIMIT 1');
    $tokenStmt->execute([$token]);
    $tokenRow = $tokenStmt->fetch(PDO::FETCH_ASSOC);

    if (!$tokenRow) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid token']);
        exit;
    }

    $adminEmail = trim($tokenRow['email'] ?? '');
    $tokenType = strtolower(trim($tokenRow['type'] ?? ''));

    if ($adminEmail === '' || $tokenType !== 'admin') {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }

    $adminStmt = $pdo->prepare('SELECT email FROM admins WHERE email = ? LIMIT 1');
    $adminStmt->execute([$adminEmail]);
    if (!$adminStmt->fetch(PDO::FETCH_ASSOC)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Admin account not found']);
        exit;
    }

    $insertStmt = $pdo->prepare('INSERT INTO learning_materials (title, category, target_program, description, link, created_by_email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())');
    $insertStmt->execute([
        mb_substr($title, 0, 255),
        mb_substr($category, 0, 150),
        $targetProgram,
        $description,
        $link,
        $adminEmail,
    ]);

    $materialId = (int)$pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'message' => 'Learning material created successfully',
        'material' => [
            'id' => (string)$materialId,
            'title' => $title,
            'category' => $category,
            'targetProgram' => $targetProgram,
            'description' => $description,
            'link' => $link ?? '',
            'createdByEmail' => $adminEmail,
        ],
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>
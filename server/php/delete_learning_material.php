<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$token = trim($_POST['token'] ?? '');
$materialId = (int)($_POST['id'] ?? 0);

if ($token === '' || $materialId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'token and id are required']);
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

    $checkStmt = $pdo->prepare('SELECT title FROM learning_materials WHERE id = ? LIMIT 1');
    $checkStmt->execute([$materialId]);
    $materialRow = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$materialRow) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Learning material not found']);
        exit;
    }

    $deleteStmt = $pdo->prepare('DELETE FROM learning_materials WHERE id = ?');
    $deleteStmt->execute([$materialId]);

    echo json_encode([
        'success' => true,
        'message' => 'Learning material deleted successfully',
        'deletedId' => (string)$materialId,
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>
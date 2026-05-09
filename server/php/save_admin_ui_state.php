<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$token = trim($_POST['token'] ?? '');
$stateKey = trim($_POST['stateKey'] ?? '');
$stateJson = trim($_POST['state'] ?? '');

if ($token === '' || $stateKey === '' || $stateJson === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'token, stateKey, and state are required']);
    exit;
}

$state = json_decode($stateJson, true);
if (!is_array($state)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid state payload']);
    exit;
}

try {
    $tokenStmt = $pdo->prepare('SELECT email, type FROM tokens WHERE token = ? LIMIT 1');
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
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }

    $stmt = $pdo->prepare('INSERT INTO admin_ui_state (email, state_key, state_json, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE state_json = VALUES(state_json), updated_at = NOW()');
    $stmt->execute([
        $adminEmail,
        $stateKey,
        json_encode($state, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
    ]);

    echo json_encode(['success' => true, 'message' => 'UI state saved successfully']);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>
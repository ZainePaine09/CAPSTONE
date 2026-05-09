<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'GET required']);
    exit;
}

$token = trim($_GET['token'] ?? '');
$stateKey = trim($_GET['stateKey'] ?? '');

if ($token === '' || $stateKey === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'token and stateKey are required']);
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
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }

    $stmt = $pdo->prepare('SELECT state_json FROM admin_ui_state WHERE email = ? AND state_key = ? LIMIT 1');
    $stmt->execute([$adminEmail, $stateKey]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    $state = $row ? json_decode((string)($row['state_json'] ?? ''), true) : null;
    if (!is_array($state)) {
        $state = [];
    }

    echo json_encode(['success' => true, 'state' => $state]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>
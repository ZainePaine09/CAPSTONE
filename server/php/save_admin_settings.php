<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$token = trim($_POST['token'] ?? '');
$profileJson = trim($_POST['profile'] ?? '');
$systemJson = trim($_POST['system'] ?? '');

if ($token === '' || $profileJson === '' || $systemJson === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'token, profile, and system are required']);
    exit;
}

$profile = json_decode($profileJson, true);
$system = json_decode($systemJson, true);

if (!is_array($profile) || !is_array($system)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid settings payload']);
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

    $profileStmt = $pdo->prepare('INSERT INTO admin_settings (email, profile_json, system_json, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE profile_json = VALUES(profile_json), system_json = VALUES(system_json), updated_at = NOW()');
    $profileStmt->execute([
        $adminEmail,
        json_encode($profile, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        json_encode($system, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
    ]);

    echo json_encode(['success' => true, 'message' => 'Settings saved successfully']);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>
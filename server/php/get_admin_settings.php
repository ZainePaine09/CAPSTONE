<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'GET required']);
    exit;
}

$token = trim($_GET['token'] ?? '');
if ($token === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'token is required']);
    exit;
}

$defaultSettings = [
    'profile' => [
        'fullName' => 'Administrator',
        'role' => 'System Administrator',
        'department' => 'Alumni Relations',
        'phone' => '+63 000 000 0000',
        'bio' => 'Administrator account for Alumni Smart Connect management.'
    ],
    'system' => [
        'twoFactor' => true,
        'emailVerification' => true,
        'notifications' => true,
        'adminEmail' => 'admin@alumnismartconnect.com',
        'platformName' => 'Alumni Smart Connect',
        'timezone' => 'Asia/Manila'
    ]
];

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

    $stmt = $pdo->prepare('SELECT profile_json, system_json FROM admin_settings WHERE email = ? LIMIT 1');
    $stmt->execute([$adminEmail]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        echo json_encode(['success' => true, 'settings' => $defaultSettings]);
        exit;
    }

    $profile = json_decode((string)($row['profile_json'] ?? ''), true);
    $system = json_decode((string)($row['system_json'] ?? ''), true);

    echo json_encode([
        'success' => true,
        'settings' => [
            'profile' => array_merge($defaultSettings['profile'], is_array($profile) ? $profile : []),
            'system' => array_merge($defaultSettings['system'], is_array($system) ? $system : [])
        ]
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>
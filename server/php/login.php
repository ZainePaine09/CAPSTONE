<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$raw = $_POST;
$email = trim($raw['email'] ?? '');
$password = $raw['password'] ?? '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 1) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT password_hash FROM students WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        echo json_encode(['success' => false, 'error' => 'Account not found']);
        exit;
    }
    if (!password_verify($password, $row['password_hash'])) {
        echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
        exit;
    }
    $token = bin2hex(random_bytes(24));
    $tstmt = $pdo->prepare('INSERT INTO tokens (token, email, type, created_at, expires_at) VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY))');
    $tstmt->execute([$token, $email, 'student']);

    $pdo->exec('DELETE FROM tokens WHERE expires_at <= NOW()');

    echo json_encode(['success' => true, 'token' => $token]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>
<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 1) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT password_hash FROM admins WHERE email = ? LIMIT 1');
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
    $tstmt = $pdo->prepare('INSERT INTO tokens (token, email, type, created_at) VALUES (?, ?, ?, datetime("now"))');
    $tstmt->execute([$token, $email, 'admin']);

    echo json_encode(['success' => true, 'token' => $token]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>
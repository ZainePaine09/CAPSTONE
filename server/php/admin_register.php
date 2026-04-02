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
$first = trim($raw['firstName'] ?? '');
$last = trim($raw['lastName'] ?? '');
$name = trim($raw['name'] ?? ($first . ' ' . $last));

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

try {
    // ensure email not already used
    $check = $pdo->prepare('SELECT id FROM admins WHERE email = ? LIMIT 1');
    $check->execute([$email]);
    if ($check->fetch(PDO::FETCH_ASSOC)) {
        echo json_encode(['success' => false, 'error' => 'Account already exists']);
        exit;
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('INSERT INTO admins (email, password_hash, name, created_at) VALUES (?, ?, ?, datetime("now"))');
    $stmt->execute([$email, $hash, $name]);

    // create token for immediate session
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

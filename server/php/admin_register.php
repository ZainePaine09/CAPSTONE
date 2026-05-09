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
$position = trim($raw['position'] ?? '');
$department = trim($raw['department'] ?? '');
$schoolName = trim($raw['schoolName'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

try {
    $adminCount = (int)$pdo->query('SELECT COUNT(*) FROM admins')->fetchColumn();

    if ($adminCount > 0) {
        $token = trim($_POST['adminToken'] ?? $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '');
        if ($token === '') {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Admin token required']);
            exit;
        }

        $tokenStmt = $pdo->prepare('SELECT type FROM tokens WHERE token = ? AND expires_at > NOW() LIMIT 1');
        $tokenStmt->execute([$token]);
        $tokenRow = $tokenStmt->fetch(PDO::FETCH_ASSOC);

        if (!$tokenRow || strtolower(trim($tokenRow['type'] ?? '')) !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Valid admin token required to create an admin account']);
            exit;
        }
    }

    // ensure email not already used
    $check = $pdo->prepare('SELECT id FROM admins WHERE email = ? LIMIT 1');
    $check->execute([$email]);
    if ($check->fetch(PDO::FETCH_ASSOC)) {
        echo json_encode(['success' => false, 'error' => 'Account already exists']);
        exit;
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('INSERT INTO admins (email, password_hash, name, position, department, school_name, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())');
    $stmt->execute([$email, $hash, $name, $position, $department, $schoolName]);

    // create token for immediate session
    $token = bin2hex(random_bytes(24));
    $tstmt = $pdo->prepare('INSERT INTO tokens (token, email, type, created_at, expires_at) VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY))');
    $tstmt->execute([$token, $email, 'admin']);

    echo json_encode(['success' => true, 'token' => $token]);
    exit;
} catch (PDOException $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}

?>

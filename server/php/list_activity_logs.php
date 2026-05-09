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

    $stmt = $pdo->query('SELECT id, actor_role, actor_email, action, details, target_email, created_at FROM audit_logs ORDER BY created_at DESC, id DESC LIMIT 200');
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $entries = array_map(static function (array $row): array {
        $role = 'admin';
        $action = strtolower(trim((string)($row['action'] ?? '')));
        $details = (string)($row['details'] ?? '');
        $email = (string)($row['actor_email'] ?? '');

        if (stripos($details, 'student') !== false) {
            $role = 'student';
        }

        return [
            'id' => $row['id'] ?? '',
            'role' => strtolower(trim((string)($row['actor_role'] ?? $role))),
            'action' => $action ?: 'activity',
            'name' => $email ?: 'Unknown User',
            'email' => $email,
            'message' => $details,
            'targetEmail' => $row['target_email'] ?? '',
            'createdAt' => $row['created_at'] ?? '',
        ];
    }, $rows);

    echo json_encode([
        'success' => true,
        'entries' => $entries,
        'count' => count($entries),
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>
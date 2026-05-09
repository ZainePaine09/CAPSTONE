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

    $stmt = $pdo->query('SELECT id, title, announcement_type, importance, announcement_date, announcement_time, description, details, created_by_email, created_at, updated_at FROM announcements ORDER BY announcement_date DESC, announcement_time DESC, id DESC');
    $announcements = array_map(static function (array $row): array {
        return [
            'id' => (int)($row['id'] ?? 0),
            'title' => $row['title'] ?? '',
            'type' => $row['announcement_type'] ?? '',
            'importance' => $row['importance'] ?? 'medium',
            'date' => $row['announcement_date'] ?? '',
            'time' => substr((string)($row['announcement_time'] ?? ''), 0, 5),
            'description' => $row['description'] ?? '',
            'details' => $row['details'] ?? '',
            'createdByEmail' => $row['created_by_email'] ?? '',
            'createdAt' => $row['created_at'] ?? '',
            'updatedAt' => $row['updated_at'] ?? ''
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));

    echo json_encode([
        'success' => true,
        'announcements' => $announcements,
        'count' => count($announcements)
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>
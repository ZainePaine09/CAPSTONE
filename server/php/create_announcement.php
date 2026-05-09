<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$token = trim($_POST['token'] ?? '');
$title = trim($_POST['title'] ?? '');
$type = trim($_POST['type'] ?? '');
$importance = strtolower(trim($_POST['importance'] ?? 'medium'));
$date = trim($_POST['date'] ?? '');
$time = trim($_POST['time'] ?? '');
$description = trim($_POST['description'] ?? '');
$details = trim($_POST['details'] ?? '');

if ($token === '' || $title === '' || $type === '' || $date === '' || $time === '' || $description === '' || $details === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'All fields are required']);
    exit;
}

if (!in_array($importance, ['high', 'medium', 'low'], true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid importance']);
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

    $stmt = $pdo->prepare('INSERT INTO announcements (title, announcement_type, importance, announcement_date, announcement_time, description, details, created_by_email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())');
    $stmt->execute([
        mb_substr($title, 0, 255),
        mb_substr($type, 0, 120),
        $importance,
        $date,
        $time,
        $description,
        $details,
        $adminEmail,
    ]);

    $announcementId = (int)$pdo->lastInsertId();

    $auditStmt = $pdo->prepare('INSERT INTO audit_logs (actor_role, actor_email, action, details, target_email, created_at) VALUES (?, ?, ?, ?, ?, NOW())');
    $auditStmt->execute([
        'admin',
        $adminEmail,
        'announcement_create',
        sprintf('Created announcement "%s".', $title),
        null,
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Announcement created successfully',
        'announcementId' => $announcementId
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>
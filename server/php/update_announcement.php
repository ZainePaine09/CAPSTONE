<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$token = trim($_POST['token'] ?? '');
$announcementId = (int)($_POST['id'] ?? 0);
$title = trim($_POST['title'] ?? '');
$type = trim($_POST['type'] ?? '');
$importance = strtolower(trim($_POST['importance'] ?? 'medium'));
$date = trim($_POST['date'] ?? '');
$time = trim($_POST['time'] ?? '');
$description = trim($_POST['description'] ?? '');
$details = trim($_POST['details'] ?? '');

if ($token === '' || $announcementId <= 0 || $title === '' || $type === '' || $date === '' || $time === '' || $description === '' || $details === '') {
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

    $lookupStmt = $pdo->prepare('SELECT id, title, announcement_date FROM announcements WHERE id = ? LIMIT 1');
    $lookupStmt->execute([$announcementId]);
    $announcement = $lookupStmt->fetch(PDO::FETCH_ASSOC);

    if (!$announcement) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Announcement not found']);
        exit;
    }

    $updateStmt = $pdo->prepare('UPDATE announcements SET title = ?, announcement_type = ?, importance = ?, announcement_date = ?, announcement_time = ?, description = ?, details = ?, updated_at = NOW() WHERE id = ?');
    $updateStmt->execute([
        mb_substr($title, 0, 255),
        mb_substr($type, 0, 120),
        $importance,
        $date,
        $time,
        $description,
        $details,
        $announcementId,
    ]);

    $auditStmt = $pdo->prepare('INSERT INTO audit_logs (actor_role, actor_email, action, details, target_email, created_at) VALUES (?, ?, ?, ?, ?, NOW())');
    $auditStmt->execute([
        'admin',
        $adminEmail,
        'announcement_update',
        sprintf('Updated announcement "%s".', $title),
        null,
    ]);

    echo json_encode(['success' => true, 'message' => 'Announcement updated successfully']);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>
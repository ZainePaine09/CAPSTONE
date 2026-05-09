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

if ($token === '' || $announcementId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'token and id are required']);
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

    $lookupStmt = $pdo->prepare('SELECT title FROM announcements WHERE id = ? LIMIT 1');
    $lookupStmt->execute([$announcementId]);
    $announcement = $lookupStmt->fetch(PDO::FETCH_ASSOC);

    if (!$announcement) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Announcement not found']);
        exit;
    }

    $deleteStmt = $pdo->prepare('DELETE FROM announcements WHERE id = ?');
    $deleteStmt->execute([$announcementId]);

    $auditStmt = $pdo->prepare('INSERT INTO audit_logs (actor_role, actor_email, action, details, target_email, created_at) VALUES (?, ?, ?, ?, ?, NOW())');
    $auditStmt->execute([
        'admin',
        $adminEmail,
        'announcement_delete',
        sprintf('Deleted announcement "%s".', $announcement['title']),
        null,
    ]);

    echo json_encode(['success' => true, 'message' => 'Announcement deleted successfully']);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>
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

    $studentsCount = (int)$pdo->query('SELECT COUNT(*) FROM students')->fetchColumn();
    $newRegistrationsStmt = $pdo->query("SELECT COUNT(*) FROM students WHERE registered_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')");
    $newRegistrationsCount = (int)$newRegistrationsStmt->fetchColumn();
    $activeEventsCount = (int)$pdo->query('SELECT COUNT(*) FROM events WHERE event_date >= CURDATE()')->fetchColumn();
    $materialsCount = (int)$pdo->query('SELECT COUNT(*) FROM learning_materials')->fetchColumn();
    $registeredEventsCount = (int)$pdo->query("SELECT COUNT(*) FROM event_registrations WHERE status = 'registered'")->fetchColumn();
    $alumniCount = (int)$pdo->query('SELECT COUNT(*) FROM alumni_profiles')->fetchColumn();

    $pendingApprovalsCount = (int)$pdo->query("SELECT COUNT(*) FROM pending_approvals WHERE status = 'pending'")->fetchColumn();

    $unreadStmt = $pdo->prepare("SELECT COUNT(*) FROM messages WHERE receiver_email = ? AND receiver_role = 'admin' AND is_read = 0");
    $unreadStmt->execute([$adminEmail]);
    $unreadMessagesCount = (int)$unreadStmt->fetchColumn();

    echo json_encode([
        'success' => true,
        'totalStudents' => $studentsCount,
        'newRegistrations' => $newRegistrationsCount,
        'totalAlumni' => $alumniCount,
        'activeEvents' => $activeEventsCount,
        'pendingApprovals' => $pendingApprovalsCount,
        'unreadMessages' => $unreadMessagesCount,
        'learningMaterials' => $materialsCount,
        'registeredEvents' => $registeredEventsCount,
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>
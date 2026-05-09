<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'GET required']);
    exit;
}

$token = trim($_GET['token'] ?? '');
$conversationEmail = trim($_GET['conversationEmail'] ?? '');

if ($token === '' || $conversationEmail === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'token and conversationEmail are required']);
    exit;
}

if (!filter_var($conversationEmail, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid conversation email']);
    exit;
}

function resolveAccountRole(PDO $pdo, string $email): ?string
{
    $adminStmt = $pdo->prepare('SELECT email FROM admins WHERE email = ? LIMIT 1');
    $adminStmt->execute([$email]);
    if ($adminStmt->fetch(PDO::FETCH_ASSOC)) {
        return 'admin';
    }

    $studentStmt = $pdo->prepare('SELECT email FROM students WHERE email = ? LIMIT 1');
    $studentStmt->execute([$email]);
    if ($studentStmt->fetch(PDO::FETCH_ASSOC)) {
        return 'student';
    }

    return null;
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

    $currentEmail = trim($tokenRow['email'] ?? '');
    $currentRole = strtolower(trim($tokenRow['type'] ?? ''));

    if ($currentEmail === '' || !in_array($currentRole, ['admin', 'student'], true)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid token payload']);
        exit;
    }

    if (strcasecmp($currentEmail, $conversationEmail) === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Cannot load conversation with yourself']);
        exit;
    }

    $participantRole = resolveAccountRole($pdo, $conversationEmail);

    if ($participantRole === null) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Conversation partner not found']);
        exit;
    }

    $stmt = $pdo->prepare('
        SELECT id, sender_email, sender_role, receiver_email, receiver_role, message_text, is_read, read_at, created_at
        FROM messages
        WHERE (sender_email = ? AND sender_role = ? AND receiver_email = ? AND receiver_role = ?)
           OR (sender_email = ? AND sender_role = ? AND receiver_email = ? AND receiver_role = ?)
        ORDER BY created_at ASC, id ASC
    ');
    $stmt->execute([
        $currentEmail,
        $currentRole,
        $conversationEmail,
        $participantRole,
        $conversationEmail,
        $participantRole,
        $currentEmail,
        $currentRole,
    ]);

    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'currentEmail' => $currentEmail,
        'currentRole' => $currentRole,
        'conversationEmail' => $conversationEmail,
        'conversationRole' => $participantRole,
        'messages' => $messages
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>
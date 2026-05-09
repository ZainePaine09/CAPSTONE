<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$token = trim($_POST['token'] ?? '');
$receiverEmail = trim($_POST['receiverEmail'] ?? '');
$messageText = trim($_POST['messageText'] ?? '');

if ($token === '' || $receiverEmail === '' || $messageText === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'token, receiverEmail, and messageText are required']);
    exit;
}

if (!filter_var($receiverEmail, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid receiver email']);
    exit;
}

if (mb_strlen($messageText) > 2000) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Message is too long']);
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

    $senderEmail = trim($tokenRow['email'] ?? '');
    $senderRole = strtolower(trim($tokenRow['type'] ?? ''));

    if ($senderEmail === '' || !in_array($senderRole, ['admin', 'student'], true)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid token payload']);
        exit;
    }

    if (strcasecmp($senderEmail, $receiverEmail) === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'You cannot message yourself']);
        exit;
    }

    $receiverRole = resolveAccountRole($pdo, $receiverEmail);

    if ($receiverRole === null) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Receiver account not found']);
        exit;
    }

    // Friendship check only applies to student↔student — skip if either side is an admin
    if ($senderRole !== 'admin' && $receiverRole !== 'admin') {
        $friendStmt = $pdo->prepare('
            SELECT 1 FROM friends
            WHERE (student_email_1 = ? AND student_email_2 = ?)
               OR (student_email_1 = ? AND student_email_2 = ?)
            LIMIT 1
        ');
        $friendStmt->execute([
            $senderEmail, $receiverEmail,
            $receiverEmail, $senderEmail,
        ]);
        if (!$friendStmt->fetch()) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'You must be connected before you can send messages']);
            exit;
        }
    }

    $insertStmt = $pdo->prepare('INSERT INTO messages (sender_email, sender_role, receiver_email, receiver_role, message_text, is_read, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())');
    $insertStmt->execute([$senderEmail, $senderRole, $receiverEmail, $receiverRole, $messageText]);

    echo json_encode([
        'success' => true,
        'message' => 'Message sent successfully',
        'data' => [
            'id' => (int)$pdo->lastInsertId(),
            'senderEmail' => $senderEmail,
            'senderRole' => $senderRole,
            'receiverEmail' => $receiverEmail,
            'receiverRole' => $receiverRole,
            'messageText' => $messageText,
            'isRead' => false,
            'createdAt' => date('Y-m-d H:i:s')
        ]
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>
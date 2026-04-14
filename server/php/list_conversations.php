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

    $currentEmail = trim($tokenRow['email'] ?? '');
    $currentRole = strtolower(trim($tokenRow['type'] ?? ''));

    if ($currentEmail === '' || !in_array($currentRole, ['admin', 'student'], true)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid token payload']);
        exit;
    }

    $sql = '
        SELECT
            CASE
                WHEN sender_email = ? AND sender_role = ? THEN receiver_email
                ELSE sender_email
            END AS conversation_email,
            CASE
                WHEN sender_email = ? AND sender_role = ? THEN receiver_role
                ELSE sender_role
            END AS conversation_role,
            message_text,
            sender_email,
            sender_role,
            receiver_email,
            receiver_role,
            is_read,
            read_at,
            created_at
        FROM messages
        WHERE (sender_email = ? AND sender_role = ?) OR (receiver_email = ? AND receiver_role = ?)
        ORDER BY created_at DESC, id DESC
    ';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $currentEmail,
        $currentRole,
        $currentEmail,
        $currentRole,
        $currentEmail,
        $currentRole,
        $currentEmail,
        $currentRole,
    ]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $conversations = [];

    foreach ($rows as $row) {
        $conversationEmail = trim($row['conversation_email'] ?? '');
        $conversationRole = strtolower(trim($row['conversation_role'] ?? ''));
        if ($conversationEmail === '' || !in_array($conversationRole, ['admin', 'student'], true)) {
            continue;
        }

        $conversationKey = $conversationRole . ':' . strtolower($conversationEmail);
        if (!isset($conversations[$conversationKey])) {
            $displayName = $conversationEmail;

            if ($conversationRole === 'admin') {
                $nameStmt = $pdo->prepare('SELECT COALESCE(NULLIF(name, ""), email) AS display_name FROM admins WHERE email = ? LIMIT 1');
                $nameStmt->execute([$conversationEmail]);
                $nameRow = $nameStmt->fetch(PDO::FETCH_ASSOC);
                if ($nameRow && !empty($nameRow['display_name'])) {
                    $displayName = $nameRow['display_name'];
                }
            } else {
                $nameStmt = $pdo->prepare('SELECT COALESCE(NULLIF(CONCAT(first_name, " ", last_name), " "), NULLIF(first_name, ""), email) AS display_name FROM students WHERE email = ? LIMIT 1');
                $nameStmt->execute([$conversationEmail]);
                $nameRow = $nameStmt->fetch(PDO::FETCH_ASSOC);
                if ($nameRow && !empty($nameRow['display_name'])) {
                    $displayName = $nameRow['display_name'];
                }
            }

            $conversations[$conversationKey] = [
                'conversationEmail' => $conversationEmail,
                'conversationRole' => $conversationRole,
                'displayName' => $displayName,
                'lastMessage' => $row['message_text'] ?? '',
                'lastMessageAt' => $row['created_at'] ?? null,
                'lastMessageSenderEmail' => $row['sender_email'] ?? '',
                'lastMessageSenderRole' => $row['sender_role'] ?? '',
                'unreadCount' => 0,
            ];
        }

        if ((string)$row['receiver_email'] === $currentEmail && strtolower((string)$row['receiver_role']) === $currentRole && (int)$row['is_read'] === 0) {
            $conversations[$conversationKey]['unreadCount'] += 1;
        }
    }

    $conversations = array_values($conversations);

    echo json_encode([
        'success' => true,
        'currentEmail' => $currentEmail,
        'currentRole' => $currentRole,
        'conversations' => $conversations
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>
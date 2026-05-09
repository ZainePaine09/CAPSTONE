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

    $currentEmail = trim($tokenRow['email'] ?? '');
    $currentRole  = strtolower(trim($tokenRow['type'] ?? ''));

    if ($currentEmail === '' || !in_array($currentRole, ['admin', 'student'], true)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid token payload']);
        exit;
    }

    // --- 1. Fetch all messages involving this user ---
    $msgStmt = $pdo->prepare('
        SELECT
            CASE WHEN sender_email = ? AND sender_role = ? THEN receiver_email ELSE sender_email END AS conversation_email,
            CASE WHEN sender_email = ? AND sender_role = ? THEN receiver_role  ELSE sender_role  END AS conversation_role,
            message_text, sender_email, sender_role, receiver_email, receiver_role, is_read, created_at
        FROM messages
        WHERE (sender_email = ? AND sender_role = ?) OR (receiver_email = ? AND receiver_role = ?)
        ORDER BY created_at DESC, id DESC
    ');
    $msgStmt->execute([
        $currentEmail, $currentRole,
        $currentEmail, $currentRole,
        $currentEmail, $currentRole,
        $currentEmail, $currentRole,
    ]);
    $rows = $msgStmt->fetchAll(PDO::FETCH_ASSOC);

    // --- 2. Build conversation map from messages, collecting emails by role ---
    $conversations  = [];
    $adminEmails    = [];
    $studentEmails  = [];

    foreach ($rows as $row) {
        $convEmail = strtolower(trim($row['conversation_email'] ?? ''));
        $convRole  = strtolower(trim($row['conversation_role'] ?? ''));
        if ($convEmail === '' || !in_array($convRole, ['admin', 'student'], true)) {
            continue;
        }

        $key = $convRole . ':' . $convEmail;
        if (!isset($conversations[$key])) {
            $conversations[$key] = [
                'conversationEmail'       => $convEmail,
                'conversationRole'        => $convRole,
                'displayName'             => $convEmail,
                'lastMessage'             => $row['message_text'] ?? '',
                'lastMessageAt'           => $row['created_at'] ?? null,
                'lastMessageSenderEmail'  => $row['sender_email'] ?? '',
                'lastMessageSenderRole'   => $row['sender_role'] ?? '',
                'unreadCount'             => 0,
            ];

            if ($convRole === 'admin') {
                $adminEmails[] = $convEmail;
            } else {
                $studentEmails[] = $convEmail;
            }
        }

        if (
            strtolower((string)$row['receiver_email']) === $currentEmail &&
            strtolower((string)$row['receiver_role'])  === $currentRole &&
            (int)$row['is_read'] === 0
        ) {
            $conversations[$key]['unreadCount'] += 1;
        }
    }

    // --- 3. Fetch friends who have no messages yet ---
    $friendsStmt = $pdo->prepare('
        SELECT student_email_1, student_email_2 FROM friends
        WHERE student_email_1 = ? OR student_email_2 = ?
    ');
    $friendsStmt->execute([$currentEmail, $currentEmail]);
    $friendRows = $friendsStmt->fetchAll(PDO::FETCH_ASSOC);

    $friendEmails = [];
    foreach ($friendRows as $fRow) {
        $fe = strtolower(trim(
            strtolower($fRow['student_email_1']) === $currentEmail
                ? $fRow['student_email_2']
                : $fRow['student_email_1']
        ));
        if ($fe !== '') {
            $friendEmails[] = $fe;
        }
    }

    // --- 4. Batch resolve friend roles (one query instead of one per friend) ---
    if (!empty($friendEmails)) {
        $ph = implode(',', array_fill(0, count($friendEmails), '?'));
        $adminRoleStmt = $pdo->prepare("SELECT email FROM admins WHERE email IN ($ph)");
        $adminRoleStmt->execute($friendEmails);
        $friendAdminSet = array_flip(array_column($adminRoleStmt->fetchAll(PDO::FETCH_ASSOC), 'email'));

        foreach ($friendEmails as $fe) {
            $friendRole = isset($friendAdminSet[$fe]) ? 'admin' : 'student';
            $key = $friendRole . ':' . $fe;

            $alreadyIn = false;
            foreach ($conversations as $c) {
                if (strtolower($c['conversationEmail']) === $fe && $c['conversationRole'] === $friendRole) {
                    $alreadyIn = true;
                    break;
                }
            }
            if ($alreadyIn) {
                continue;
            }

            $conversations[$key] = [
                'conversationEmail'      => $fe,
                'conversationRole'       => $friendRole,
                'displayName'            => $fe,
                'lastMessage'            => '',
                'lastMessageAt'          => null,
                'lastMessageSenderEmail' => '',
                'lastMessageSenderRole'  => '',
                'unreadCount'            => 0,
            ];

            if ($friendRole === 'admin') {
                $adminEmails[] = $fe;
            } else {
                $studentEmails[] = $fe;
            }
        }
    }

    // --- 5. Batch resolve display names (two queries total) ---
    $adminEmails   = array_unique($adminEmails);
    $studentEmails = array_unique($studentEmails);
    $nameMap       = [];

    if (!empty($adminEmails)) {
        $ph = implode(',', array_fill(0, count($adminEmails), '?'));
        $stmt = $pdo->prepare("SELECT email, COALESCE(NULLIF(name, ''), email) AS display_name FROM admins WHERE email IN ($ph)");
        $stmt->execute($adminEmails);
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $nameMap['admin:' . strtolower($r['email'])] = $r['display_name'];
        }
    }

    if (!empty($studentEmails)) {
        $ph = implode(',', array_fill(0, count($studentEmails), '?'));
        $stmt = $pdo->prepare("SELECT email, COALESCE(NULLIF(CONCAT(first_name, ' ', last_name), ' '), NULLIF(first_name, ''), email) AS display_name FROM students WHERE email IN ($ph)");
        $stmt->execute($studentEmails);
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $nameMap['student:' . strtolower($r['email'])] = $r['display_name'];
        }
    }

    // --- 6. Apply resolved names ---
    foreach ($conversations as &$conv) {
        $nameKey = $conv['conversationRole'] . ':' . strtolower($conv['conversationEmail']);
        if (isset($nameMap[$nameKey])) {
            $conv['displayName'] = $nameMap[$nameKey];
        }
    }
    unset($conv);

    echo json_encode([
        'success'       => true,
        'currentEmail'  => $currentEmail,
        'currentRole'   => $currentRole,
        'conversations' => array_values($conversations),
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>

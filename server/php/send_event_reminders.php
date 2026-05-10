<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/announcement_mailer.php';

// Simple secret key to prevent public access.
// Set REMINDER_SECRET to any random string and use the same value in your cron URL.
// Example cron URL: https://yourdomain.com/server/php/send_event_reminders.php?secret=YOUR_SECRET
define('REMINDER_SECRET', 'asc_reminder_2026');

$secret = trim($_GET['secret'] ?? $_POST['secret'] ?? '');
if ($secret !== REMINDER_SECRET) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Forbidden']);
    exit;
}

try {
    // Add reminder_sent column if it doesn't exist yet (safe to run repeatedly)
    try {
        $pdo->exec("ALTER TABLE announcements ADD COLUMN reminder_sent TINYINT(1) NOT NULL DEFAULT 0");
    } catch (PDOException $e) {
        // Column already exists — ignore
    }

    // Find announcements exactly 2 days from today that haven't had reminders sent
    $stmt = $pdo->prepare("
        SELECT id, title, announcement_type, announcement_date, announcement_time, description, details
        FROM announcements
        WHERE announcement_date = DATE_ADD(CURDATE(), INTERVAL 2 DAY)
          AND reminder_sent = 0
    ");
    $stmt->execute();
    $announcements = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($announcements)) {
        echo json_encode(['success' => true, 'message' => 'No reminders to send today', 'sent' => 0]);
        exit;
    }

    $totalSent   = 0;
    $totalErrors = 0;

    foreach ($announcements as $ann) {
        $result = sendReminderEmails($pdo, [
            'title'       => $ann['title'],
            'type'        => $ann['announcement_type'],
            'date'        => $ann['announcement_date'],
            'time'        => $ann['announcement_time'],
            'description' => $ann['description'],
        ]);

        $totalSent   += $result['sent'];
        $totalErrors += $result['errors'];

        // Mark reminder as sent regardless of individual email errors
        $pdo->prepare("UPDATE announcements SET reminder_sent = 1 WHERE id = ?")
            ->execute([$ann['id']]);
    }

    echo json_encode([
        'success'     => true,
        'processed'   => count($announcements),
        'sent'        => $totalSent,
        'errors'      => $totalErrors,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
}

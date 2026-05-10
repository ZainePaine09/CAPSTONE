<?php
require_once __DIR__ . '/email_config.php';
require_once __DIR__ . '/mailer/Exception.php';
require_once __DIR__ . '/mailer/PHPMailer.php';
require_once __DIR__ . '/mailer/SMTP.php';

/**
 * Send announcement notification emails.
 *
 * Registered students (for any event on the announcement date) get an
 * immediate "you have a registered event" email.
 * All other students are left for the 2-day cron reminder.
 *
 * Returns ['sent' => int, 'errors' => int]
 */
function sendAnnouncementEmails(PDO $pdo, array $announcement): array
{
    if (SMTP_PASS === '') {
        return ['sent' => 0, 'errors' => 0];
    }

    $title       = $announcement['title']       ?? '';
    $date        = $announcement['date']        ?? '';
    $time        = $announcement['time']        ?? '';
    $description = $announcement['description'] ?? '';
    $type        = $announcement['type']        ?? '';

    // All active students
    $allStudents = $pdo->query("SELECT email, first_name, last_name FROM students")->fetchAll(PDO::FETCH_ASSOC);
    if (empty($allStudents)) {
        return ['sent' => 0, 'errors' => 0];
    }

    // Students registered for any event on the announcement date
    $regStmt = $pdo->prepare("
        SELECT DISTINCT er.student_email
        FROM event_registrations er
        JOIN events e ON e.id = er.event_id
        WHERE e.event_date = ? AND er.status = 'registered'
    ");
    $regStmt->execute([$date]);
    $registeredEmails = array_flip(array_column($regStmt->fetchAll(PDO::FETCH_ASSOC), 'student_email'));

    $formattedDate = $date ? date('F j, Y', strtotime($date)) : '';
    $formattedTime = $time ? date('g:i A', strtotime($time)) : '';

    $sent   = 0;
    $errors = 0;

    foreach ($allStudents as $student) {
        $email     = $student['email'];
        $firstName = $student['first_name'] ?? 'Student';
        $isReg     = isset($registeredEmails[$email]);

        if (!$isReg) {
            // Unregistered students are handled by the 2-day cron reminder — skip for now
            continue;
        }

        $subject = "Upcoming Event Reminder: {$title}";
        $body    = "Hi {$firstName},\n\n"
                 . "This is a reminder that you are registered for an upcoming event:\n\n"
                 . "  Event: {$title}\n"
                 . "  Type:  {$type}\n"
                 . "  Date:  {$formattedDate}\n"
                 . "  Time:  {$formattedTime}\n\n"
                 . "Details:\n{$description}\n\n"
                 . "See you there!\n\n"
                 . "— Alumni Smart Connect";

        if (sendSingleEmail($email, $firstName, $subject, $body)) {
            $sent++;
        } else {
            $errors++;
        }
    }

    return ['sent' => $sent, 'errors' => $errors];
}

/**
 * Send 2-day reminder emails to students NOT registered for events on a given date.
 */
function sendReminderEmails(PDO $pdo, array $announcement): array
{
    if (SMTP_PASS === '') {
        return ['sent' => 0, 'errors' => 0];
    }

    $title       = $announcement['title']       ?? '';
    $date        = $announcement['date']        ?? '';
    $time        = $announcement['time']        ?? '';
    $description = $announcement['description'] ?? '';
    $type        = $announcement['type']        ?? '';

    $allStudents = $pdo->query("SELECT email, first_name, last_name FROM students")->fetchAll(PDO::FETCH_ASSOC);
    if (empty($allStudents)) {
        return ['sent' => 0, 'errors' => 0];
    }

    // Students already registered for an event on that date
    $regStmt = $pdo->prepare("
        SELECT DISTINCT er.student_email
        FROM event_registrations er
        JOIN events e ON e.id = er.event_id
        WHERE e.event_date = ? AND er.status = 'registered'
    ");
    $regStmt->execute([$date]);
    $registeredEmails = array_flip(array_column($regStmt->fetchAll(PDO::FETCH_ASSOC), 'student_email'));

    $formattedDate = $date ? date('F j, Y', strtotime($date)) : '';
    $formattedTime = $time ? date('g:i A', strtotime($time)) : '';

    $sent   = 0;
    $errors = 0;

    foreach ($allStudents as $student) {
        $email     = $student['email'];
        $firstName = $student['first_name'] ?? 'Student';

        if (isset($registeredEmails[$email])) {
            continue; // Already registered — they got the immediate email
        }

        $subject = "Heads Up: {$title} is in 2 Days!";
        $body    = "Hi {$firstName},\n\n"
                 . "Just a friendly reminder — there is an upcoming event in 2 days that you may want to join:\n\n"
                 . "  Event: {$title}\n"
                 . "  Type:  {$type}\n"
                 . "  Date:  {$formattedDate}\n"
                 . "  Time:  {$formattedTime}\n\n"
                 . "Details:\n{$description}\n\n"
                 . "Log in to Alumni Smart Connect to register or learn more.\n\n"
                 . "— Alumni Smart Connect";

        if (sendSingleEmail($email, $firstName, $subject, $body)) {
            $sent++;
        } else {
            $errors++;
        }
    }

    return ['sent' => $sent, 'errors' => $errors];
}

function sendSingleEmail(string $toEmail, string $toName, string $subject, string $body): bool
{
    try {
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USER;
        $mail->Password   = SMTP_PASS;
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;

        $mail->setFrom(SMTP_USER, SMTP_FROM_NAME);
        $mail->addAddress($toEmail, $toName);

        $mail->isHTML(false);
        $mail->Subject = $subject;
        $mail->Body    = $body;

        $mail->send();
        return true;
    } catch (\Exception $e) {
        error_log("Email failed to {$toEmail}: " . $e->getMessage());
        return false;
    }
}

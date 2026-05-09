<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/csrf.php';

// ── Email recipients ──────────────────────────────────────────
// Add or remove emails from this array to control who gets notified.
$NOTIFY_RECIPIENTS = [
    'maxicario07@gmail.com',
];

// ── Gmail SMTP credentials ────────────────────────────────────
// Use a Gmail App Password (NOT your real Gmail password).
// Generate one at: https://myaccount.google.com/apppasswords
$SMTP_USER = 'maxicario07@gmail.com';
$SMTP_PASS = '';  // <-- paste your Gmail App Password here

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

verifyCsrfOrigin();

$name    = trim($_POST['name'] ?? '');
$email   = trim($_POST['email'] ?? '');
$message = trim($_POST['message'] ?? '');

if ($name === '' || $email === '' || $message === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'All fields are required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid email address']);
    exit;
}

// Save to database
try {
    $stmt = $pdo->prepare('INSERT INTO contact_messages (name, email, message, created_at) VALUES (?, ?, ?, NOW())');
    $stmt->execute([
        mb_substr($name, 0, 150),
        mb_substr($email, 0, 191),
        $message,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}

// Send email notification if App Password is set
if ($SMTP_PASS !== '' && !empty($NOTIFY_RECIPIENTS)) {
    try {
        require_once __DIR__ . '/mailer/Exception.php';
        require_once __DIR__ . '/mailer/PHPMailer.php';
        require_once __DIR__ . '/mailer/SMTP.php';

        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = $SMTP_USER;
        $mail->Password   = $SMTP_PASS;
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;

        $mail->setFrom($SMTP_USER, 'Alumni Smart Connect');
        $mail->addReplyTo($email, $name);

        foreach ($NOTIFY_RECIPIENTS as $recipient) {
            $mail->addAddress($recipient);
        }

        $mail->isHTML(false);
        $mail->Subject = "New Contact Message from {$name}";
        $mail->Body    = "You received a new contact message from the Alumni Smart Connect portal.\n\n"
                       . "Name: {$name}\n"
                       . "Email: {$email}\n"
                       . "Message:\n{$message}";

        $mail->send();
    } catch (\Exception $e) {
        // Email failed but message was already saved to DB — still return success
        error_log('Contact email failed: ' . $e->getMessage());
    }
}

echo json_encode(['success' => true, 'message' => 'Contact message submitted successfully']);
exit;
?>
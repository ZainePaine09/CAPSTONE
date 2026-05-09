<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$raw = $_POST;
$token = trim($raw['token'] ?? '');

if (!$token) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Token required']);
    exit;
}

try {
    // Verify token and get associated email
    $tstmt = $pdo->prepare('SELECT email FROM tokens WHERE token = ? AND expires_at > NOW() LIMIT 1');
    $tstmt->execute([$token]);
    $trow = $tstmt->fetch(PDO::FETCH_ASSOC);
    if (!$trow) {
        echo json_encode(['success' => false, 'error' => 'Invalid token']);
        exit;
    }

    $email = $trow['email'];
    $stmt = $pdo->prepare('SELECT s.email, s.first_name, s.last_name, s.student_number, s.program, s.graduation_year, s.registered_at, sp.phone, sp.dob, sp.gender, sp.location, sp.degree, sp.university, sp.gpa, sp.major, sp.position, sp.company, sp.industry, sp.experience, sp.bio, sp.about_me, sp.skills_json, sp.profile_image, sp.gmail_address, sp.auth_provider FROM students s LEFT JOIN student_profiles sp ON sp.email = s.email WHERE s.email = ? LIMIT 1');
    $stmt->execute([$email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        echo json_encode(['success' => false, 'error' => 'Profile not found']);
        exit;
    }

    $skills = [];
    if (!empty($row['skills_json'])) {
        $decodedSkills = json_decode((string)$row['skills_json'], true);
        if (is_array($decodedSkills)) {
            $skills = array_values(array_filter(array_map('strval', $decodedSkills)));
        }
    }

    $profile = [
        'firstName' => $row['first_name'] ?? '',
        'lastName' => $row['last_name'] ?? '',
        'fullName' => trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? '')) ?: $row['email'],
        'email' => $row['email'],
        'phone' => $row['phone'] ?? '',
        'dob' => $row['dob'] ?? '',
        'gender' => $row['gender'] ?? '',
        'location' => $row['location'] ?? '',
        'studentId' => $row['student_number'] ?? '',
        'studentNumber' => $row['student_number'] ?? '',
        'program' => $row['program'] ?? '',
        'degree' => $row['degree'] ?? '',
        'graduationYear' => $row['graduation_year'] ?? '',
        'registeredDate' => $row['registered_at'] ?? '',
        'university' => $row['university'] ?? '',
        'gpa' => $row['gpa'] ?? '',
        'major' => $row['major'] ?? '',
        'position' => $row['position'] ?? '',
        'company' => $row['company'] ?? '',
        'industry' => $row['industry'] ?? '',
        'experience' => $row['experience'] ?? '',
        'bio' => $row['bio'] ?? '',
        'aboutMe' => $row['about_me'] ?? '',
        'skills' => $skills,
        'profileImage' => $row['profile_image'] ?? '',
        'gmailAddress' => $row['gmail_address'] ?? '',
        'authProvider' => $row['auth_provider'] ?? ''
    ];

    echo json_encode(['success' => true, 'profile' => $profile]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>

<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$raw = $_POST;
$token = trim((string)($raw['token'] ?? ''));

if ($token === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Token required']);
    exit;
}

try {
    $tokenStmt = $pdo->prepare('SELECT email FROM tokens WHERE token = ? LIMIT 1');
    $tokenStmt->execute([$token]);
    $tokenRow = $tokenStmt->fetch(PDO::FETCH_ASSOC);

    if (!$tokenRow) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid token']);
        exit;
    }

    $email = trim((string)($tokenRow['email'] ?? ''));
    if ($email === '') {
        throw new RuntimeException('Unable to resolve student account');
    }

    $fullName = trim((string)($raw['fullName'] ?? ''));
    $nameParts = preg_split('/\s+/', $fullName) ?: [];
    $firstName = array_shift($nameParts) ?: '';
    $lastName = trim(implode(' ', $nameParts));

    $profileImage = trim((string)($raw['profileImage'] ?? ''));
    $skills = $raw['skills'] ?? '[]';
    if (is_array($skills)) {
        $skills = json_encode(array_values(array_filter(array_map('strval', $skills))), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    } elseif (is_string($skills)) {
        $decodedSkills = json_decode($skills, true);
        $skills = is_array($decodedSkills)
            ? json_encode(array_values(array_filter(array_map('strval', $decodedSkills))), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
            : '[]';
    } else {
        $skills = '[]';
    }

    $fields = [
        'phone' => trim((string)($raw['phone'] ?? '')) ?: null,
        'dob' => trim((string)($raw['dob'] ?? '')) ?: null,
        'gender' => trim((string)($raw['gender'] ?? '')) ?: null,
        'location' => trim((string)($raw['location'] ?? '')) ?: null,
        'degree' => trim((string)($raw['degree'] ?? '')) ?: null,
        'university' => trim((string)($raw['university'] ?? '')) ?: null,
        'graduationYear' => trim((string)($raw['graduationYear'] ?? '')) ?: null,
        'gpa' => trim((string)($raw['gpa'] ?? '')) ?: null,
        'major' => trim((string)($raw['major'] ?? '')) ?: null,
        'position' => trim((string)($raw['position'] ?? '')) ?: null,
        'company' => trim((string)($raw['company'] ?? '')) ?: null,
        'industry' => trim((string)($raw['industry'] ?? '')) ?: null,
        'experience' => trim((string)($raw['experience'] ?? '')) ?: null,
        'bio' => trim((string)($raw['bio'] ?? '')) ?: null,
        'aboutMe' => trim((string)($raw['aboutMe'] ?? '')) ?: null,
        'profileImage' => $profileImage !== '' ? $profileImage : null,
        'gmailAddress' => trim((string)($raw['gmailAddress'] ?? '')) ?: null,
        'authProvider' => trim((string)($raw['authProvider'] ?? '')) ?: null,
    ];

    if (!empty($fields['graduationYear']) && !preg_match('/^\d{4}$/', $fields['graduationYear'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Graduation year must be a four-digit year']);
        exit;
    }

    if (!empty($fields['dob']) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fields['dob'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Date of birth must use YYYY-MM-DD format']);
        exit;
    }

    $profileStmt = $pdo->prepare('INSERT INTO student_profiles (email, phone, dob, gender, location, degree, university, graduation_year, gpa, major, position, company, industry, experience, bio, about_me, skills_json, profile_image, gmail_address, auth_provider, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE phone = VALUES(phone), dob = VALUES(dob), gender = VALUES(gender), location = VALUES(location), degree = VALUES(degree), university = VALUES(university), graduation_year = VALUES(graduation_year), gpa = VALUES(gpa), major = VALUES(major), position = VALUES(position), company = VALUES(company), industry = VALUES(industry), experience = VALUES(experience), bio = VALUES(bio), about_me = VALUES(about_me), skills_json = VALUES(skills_json), profile_image = VALUES(profile_image), gmail_address = VALUES(gmail_address), auth_provider = VALUES(auth_provider), updated_at = NOW()');
    $profileStmt->execute([
        $email,
        $fields['phone'],
        $fields['dob'],
        $fields['gender'],
        $fields['location'],
        $fields['degree'],
        $fields['university'],
        $fields['graduationYear'],
        $fields['gpa'],
        $fields['major'],
        $fields['position'],
        $fields['company'],
        $fields['industry'],
        $fields['experience'],
        $fields['bio'],
        $fields['aboutMe'],
        $skills,
        $fields['profileImage'],
        $fields['gmailAddress'],
        $fields['authProvider'],
    ]);

    $studentStmt = $pdo->prepare("UPDATE students SET first_name = ?, last_name = ?, graduation_year = COALESCE(NULLIF(?, ''), graduation_year) WHERE email = ? LIMIT 1");
    $studentStmt->execute([$firstName, $lastName, $fields['graduationYear'], $email]);

    echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
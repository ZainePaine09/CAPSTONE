<?php
function verifyCsrfOrigin(): void
{
    $origin  = $_SERVER['HTTP_ORIGIN']  ?? '';
    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    $host    = $_SERVER['HTTP_HOST']    ?? '';

    // Use Origin header first; fall back to Referer
    $check = $origin !== '' ? $origin : $referer;

    // If neither header is present the request is likely server-side or a
    // same-origin form — allow it through
    if ($check === '' || $host === '') {
        return;
    }

    $checkHost = parse_url($check, PHP_URL_HOST);

    // Allow same host and localhost for local development
    if ($checkHost === $host || $checkHost === 'localhost' || $checkHost === '127.0.0.1') {
        return;
    }

    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Forbidden']);
    exit;
}

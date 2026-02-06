<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['ok' => false, 'message' => 'Invalid request method.'], 405);
}

$payload = json_decode(file_get_contents('php://input'), true);
if (!is_array($payload)) {
    $payload = $_POST;
}

$type = sanitize_string($payload['type'] ?? '');
$name = sanitize_string($payload['name'] ?? '');
$email = sanitize_string($payload['email'] ?? '');
$phone = sanitize_string($payload['phone'] ?? '');
$message = sanitize_string($payload['message'] ?? '');
$details = $payload['details'] ?? [];

if ($type === '' || $name === '' || $phone === '') {
    respond(['ok' => false, 'message' => 'Please fill the required fields.'], 422);
}

$requests = read_requests();
$requests[] = [
    'id' => uniqid('req_', true),
    'type' => $type,
    'name' => $name,
    'email' => $email,
    'phone' => $phone,
    'message' => $message,
    'details' => $details,
    'created_at' => date('c'),
];

if (!write_requests($requests)) {
    respond(['ok' => false, 'message' => 'Unable to save your request. Please try again.'], 500);
}

respond(['ok' => true, 'message' => 'Thank you! We received your request. Our team will reach out shortly.']);

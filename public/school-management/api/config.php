<?php
header('Content-Type: application/json');

function get_storage_path(): string
{
    return dirname(__DIR__) . '/data/requests.json';
}

function read_requests(): array
{
    $path = get_storage_path();
    if (!file_exists($path)) {
        return [];
    }
    $contents = file_get_contents($path);
    if ($contents === false || trim($contents) === '') {
        return [];
    }
    $decoded = json_decode($contents, true);
    if (!is_array($decoded)) {
        return [];
    }
    return $decoded;
}

function write_requests(array $requests): bool
{
    $path = get_storage_path();
    $payload = json_encode($requests, JSON_PRETTY_PRINT);
    if ($payload === false) {
        return false;
    }
    return file_put_contents($path, $payload) !== false;
}

function sanitize_string(?string $value): string
{
    return trim(filter_var($value ?? '', FILTER_SANITIZE_FULL_SPECIAL_CHARS));
}

function respond(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

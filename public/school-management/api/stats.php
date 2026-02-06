<?php
require_once __DIR__ . '/config.php';

$requests = read_requests();

$stats = [
    'total' => count($requests),
    'admissions' => 0,
    'feedback' => 0,
    'staff' => 0,
    'transport' => 0,
    'other' => 0,
];

foreach ($requests as $request) {
    $type = $request['type'] ?? 'other';
    if (array_key_exists($type, $stats)) {
        $stats[$type] += 1;
    } else {
        $stats['other'] += 1;
    }
}

respond(['ok' => true, 'stats' => $stats]);

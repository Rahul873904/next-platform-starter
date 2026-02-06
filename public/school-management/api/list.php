<?php
require_once __DIR__ . '/config.php';

$requests = array_reverse(read_requests());
$recent = array_slice($requests, 0, 6);

respond(['ok' => true, 'items' => $recent]);

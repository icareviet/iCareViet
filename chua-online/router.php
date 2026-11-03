<?php
declare(strict_types=1);
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');
$root = realpath(__DIR__ . '/public');
$candidate = realpath($root . $path);
if ($candidate && str_starts_with($candidate, $root . DIRECTORY_SEPARATOR) && is_file($candidate)) {
    return false;
}
if ($path === '/') { require $root . '/index.php'; return true; }
http_response_code(404);
header('Content-Type: text/plain; charset=utf-8');
echo 'Không tìm thấy trang.';

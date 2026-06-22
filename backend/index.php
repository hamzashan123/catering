<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/db.php';
require_once __DIR__ . '/middleware/auth.php';

require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/DashboardController.php';
require_once __DIR__ . '/controllers/UserController.php';
require_once __DIR__ . '/controllers/FieldController.php';
require_once __DIR__ . '/controllers/BookInController.php';
require_once __DIR__ . '/controllers/ReportController.php';

$database = new Database();
$db = $database->connect();

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$base = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
$path = '/' . trim(substr($uri, strlen($base)), '/');
$segments = array_values(array_filter(explode('/', trim($path, '/'))));

try {
    require __DIR__ . '/routes/auth.php';
    require __DIR__ . '/routes/dashboard.php';
    require __DIR__ . '/routes/users.php';
    require __DIR__ . '/routes/fields.php';
    require __DIR__ . '/routes/bookins.php';
    require __DIR__ . '/routes/reports.php';

    json_response(['message' => 'Route not found', 'path' => $path], 404);
} catch (Throwable $error) {
    json_response([
        'message' => 'Server error',
        'error' => $error->getMessage()
    ], 500);
}

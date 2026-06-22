<?php

class ReportController
{
    public static function list(mysqli $db): void
    {
        current_user($db);
        self::ensureChargeDateColumn($db);

        $ids = array_filter(array_map('intval', explode(',', $_GET['ids'] ?? '')));

        if (!$ids) {
            json_response(['data' => []]);
        }

        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $types = str_repeat('i', count($ids));

        $rows = db_select(
            $db,
            "SELECT b.*, c.name AS client, o.name AS owner, p.name AS pm, t.name AS appliance_type,
                    DATEDIFF(CURDATE(), b.date_received) AS held_days,
                    GREATEST(DATEDIFF(CURDATE(), COALESCE(b.charge_date, DATE_ADD(b.date_received, INTERVAL 30 DAY))), 0) AS chargeable_days,
                    COALESCE(b.charge_date, DATE_ADD(b.date_received, INTERVAL 30 DAY)) AS effective_charge_date,
                    (SELECT file_path FROM book_in_images bi WHERE bi.book_in_id = b.id ORDER BY sort_order ASC LIMIT 1) AS first_image
             FROM book_ins b
             LEFT JOIN clients c ON c.id = b.client_id
             LEFT JOIN owners o ON o.id = b.owner_id
             LEFT JOIN pms p ON p.id = b.pm_id
             LEFT JOIN appliance_types t ON t.id = b.type_id
             WHERE b.id IN ({$placeholders})
             ORDER BY b.stock_code ASC",
            $types,
            $ids
        );

        $activityRows = db_select(
            $db,
            "SELECT book_in_id, id, activity, activity_date, hours
             FROM stock_activities
             WHERE book_in_id IN ({$placeholders})
             ORDER BY book_in_id ASC, activity_date ASC, id ASC",
            $types,
            $ids
        );

        $activitiesByBookIn = [];
        foreach ($activityRows as $activity) {
            $bookInId = (int) $activity['book_in_id'];
            if (!isset($activitiesByBookIn[$bookInId])) {
                $activitiesByBookIn[$bookInId] = [];
            }
            $activitiesByBookIn[$bookInId][] = $activity;
        }

        foreach ($rows as &$row) {
            $row['activities'] = $activitiesByBookIn[(int) $row['id']] ?? [];
        }
        unset($row);

        json_response(['data' => $rows]);
    }

    private static function ensureChargeDateColumn(mysqli $db): void
    {
        $column = db_first($db, "SHOW COLUMNS FROM book_ins LIKE 'charge_date'");
        if (!$column) {
            db_execute($db, "ALTER TABLE book_ins ADD COLUMN charge_date DATE NULL AFTER date_received");
            db_execute($db, "UPDATE book_ins SET charge_date = DATE_ADD(date_received, INTERVAL 30 DAY) WHERE charge_date IS NULL AND date_received IS NOT NULL");
        }
    }

    public static function image(mysqli $db): void
    {
        $requestedPath = $_GET['path'] ?? '';
        $requestedPath = str_replace('\\', '/', $requestedPath);

        if (!$requestedPath || strpos($requestedPath, '/uploads/') !== 0) {
            http_response_code(400);
            echo 'Invalid image path';
            exit;
        }

        $relativePath = ltrim($requestedPath, '/');
        $filePath = realpath(__DIR__ . '/../' . $relativePath);
        $uploadsRoot = realpath(__DIR__ . '/../uploads');

        if (!$filePath || !$uploadsRoot || strpos($filePath, $uploadsRoot) !== 0 || !is_file($filePath)) {
            http_response_code(404);
            echo 'Image not found';
            exit;
        }

        $mimeType = mime_content_type($filePath) ?: 'application/octet-stream';
        if (!in_array($mimeType, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'])) {
            http_response_code(415);
            echo 'Unsupported image type';
            exit;
        }

        header('Access-Control-Allow-Origin: *');
        header('Content-Type: ' . $mimeType);
        header('Cache-Control: public, max-age=86400');
        readfile($filePath);
        exit;
    }

}

<?php

class BookInController
{
    public static function index(mysqli $db): void
    {
        current_user($db);
        self::ensureChargeDateColumn($db);

        $filters = $_GET;
        $where = ['b.archived = ?'];
        $types = 'i';
        $params = [isset($filters['archived']) ? (int) $filters['archived'] : 0];

        $map = [
            'client_id' => 'b.client_id',
            'owner_id' => 'b.owner_id',
            'type_id' => 'b.type_id',
            'pm_id' => 'b.pm_id',
            'condition_grade' => 'b.condition_grade',
            'stock_category' => 'b.stock_category',
            'action_status' => 'b.action_status'
        ];

        foreach ($map as $field => $column) {
            if (!empty($filters[$field]) && $filters[$field] !== 'All') {
                $where[] = "{$column} = ?";
                $types .= is_numeric($filters[$field]) ? 'i' : 's';
                $params[] = is_numeric($filters[$field]) ? (int) $filters[$field] : $filters[$field];
            }
        }

        if (!empty($filters['search'])) {
            $where[] = 'b.removed_from LIKE ?';
            $types .= 's';
            $params[] = '%' . $filters['search'] . '%';
        }

        if (!empty($filters['date_from'])) {
            $where[] = 'b.date_received >= ?';
            $types .= 's';
            $params[] = $filters['date_from'];
        }

        if (!empty($filters['date_to'])) {
            $where[] = 'b.date_received <= ?';
            $types .= 's';
            $params[] = $filters['date_to'];
        }

        $allowedSorts = [
            'stock_code' => 'b.stock_code',
            'client' => 'c.name',
            'appliance_type' => 't.name',
            'condition_grade' => 'b.condition_grade',
            'action_status' => 'b.action_status',
            'stock_category' => 'b.stock_category',
            'held_days' => 'held_days',
            'chargeable_days' => 'chargeable_days',
            'removed_from' => 'b.removed_from',
            'pm' => 'p.name',
            'date_received' => 'b.date_received',
            'created_at' => 'b.created_at',
            'id' => 'b.id'
        ];

        $sort = $allowedSorts[$filters['sort'] ?? 'created_at'] ?? 'b.created_at';
        $dir = strtoupper($filters['dir'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';

        $sql = "SELECT
                    b.*,
                    c.name AS client,
                    o.name AS owner,
                    p.name AS pm,
                    t.name AS appliance_type,
                    DATEDIFF(CURDATE(), b.date_received) AS held_days,
                    GREATEST(DATEDIFF(CURDATE(), COALESCE(b.charge_date, DATE_ADD(b.date_received, INTERVAL 30 DAY))), 0) AS chargeable_days,
                    COALESCE(b.charge_date, DATE_ADD(b.date_received, INTERVAL 30 DAY)) AS effective_charge_date,
                    (SELECT file_path FROM book_in_images bi WHERE bi.book_in_id = b.id ORDER BY sort_order ASC LIMIT 1) AS first_image,
                    (SELECT GROUP_CONCAT(file_path ORDER BY sort_order ASC SEPARATOR '||') FROM book_in_images bi2 WHERE bi2.book_in_id = b.id) AS image_paths
                FROM book_ins b
                LEFT JOIN clients c ON c.id = b.client_id
                LEFT JOIN owners o ON o.id = b.owner_id
                LEFT JOIN pms p ON p.id = b.pm_id
                LEFT JOIN appliance_types t ON t.id = b.type_id
                WHERE " . implode(' AND ', $where) . "
                ORDER BY {$sort} {$dir}";

        $rows = db_select($db, $sql, $types, $params);

        json_response(['data' => $rows]);
    }

    public static function show(mysqli $db, int $id): void
    {
        current_user($db);
        self::ensureChargeDateColumn($db);

        $record = db_first(
            $db,
            "SELECT b.*, c.name AS client, o.name AS owner, p.name AS pm, t.name AS appliance_type,
                    DATEDIFF(CURDATE(), b.date_received) AS held_days,
                    GREATEST(DATEDIFF(CURDATE(), COALESCE(b.charge_date, DATE_ADD(b.date_received, INTERVAL 30 DAY))), 0) AS chargeable_days,
                    COALESCE(b.charge_date, DATE_ADD(b.date_received, INTERVAL 30 DAY)) AS effective_charge_date
             FROM book_ins b
             LEFT JOIN clients c ON c.id = b.client_id
             LEFT JOIN owners o ON o.id = b.owner_id
             LEFT JOIN pms p ON p.id = b.pm_id
             LEFT JOIN appliance_types t ON t.id = b.type_id
             WHERE b.id = ?",
            'i',
            [$id]
        );

        if (!$record) {
            json_response(['message' => 'BookIn record not found'], 404);
        }

        $record['images'] = db_select(
            $db,
            "SELECT id, file_path, original_name, sort_order FROM book_in_images WHERE book_in_id = ? ORDER BY sort_order ASC, id ASC",
            'i',
            [$id]
        );

        $record['activities'] = db_select(
            $db,
            "SELECT id, activity, activity_date, hours FROM stock_activities WHERE book_in_id = ? ORDER BY activity_date ASC, id ASC",
            'i',
            [$id]
        );

        json_response(['data' => $record]);
    }

    public static function store(mysqli $db): void
    {
        $user = current_user($db);
        self::ensureChargeDateColumn($db);
        require_admin($user);

        $data = $_POST;
        $stockCode = self::generateStockCode($db);

        db_execute(
            $db,
            "INSERT INTO book_ins
             (stock_code, make, model, serial_no, type_id, qty, length_mm, depth_mm, condition_grade, stock_category,
              client_id, owner_id, removed_from, pm_id, date_received, charge_date, action_status, notes, created_by, updated_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            'ssssiiiissiisissssii',
            [
                $stockCode,
                $data['make'] ?? '',
                $data['model'] ?? '',
                $data['serial_no'] ?? '',
                (int) ($data['type_id'] ?? 0),
                (int) ($data['qty'] ?? 1),
                (int) ($data['length_mm'] ?? 0),
                (int) ($data['depth_mm'] ?? 0),
                $data['condition_grade'] ?? '',
                $data['stock_category'] ?? '',
                (int) ($data['client_id'] ?? 0),
                (int) ($data['owner_id'] ?? 0),
                $data['removed_from'] ?? '',
                (int) ($data['pm_id'] ?? 0),
                $data['date_received'] ?? null,
                self::normaliseChargeDate($data),
                $data['action_status'] ?? '',
                $data['notes'] ?? '',
                (int) $user['id'],
                (int) $user['id']
            ]
        );

        $id = $db->insert_id;
        self::saveImages($db, $id);

        json_response(['message' => 'BookIn saved', 'id' => $id], 201);
    }


    public static function update(mysqli $db, int $id): void
    {
        $user = current_user($db);
        self::ensureChargeDateColumn($db);
        require_admin($user);

        $existing = db_first($db, "SELECT id FROM book_ins WHERE id = ?", 'i', [$id]);

        if (!$existing) {
            json_response(['message' => 'BookIn record not found'], 404);
        }

        $data = $_POST;

        db_execute(
            $db,
            "UPDATE book_ins SET
                make = ?, model = ?, serial_no = ?, type_id = ?, qty = ?, length_mm = ?, depth_mm = ?,
                condition_grade = ?, stock_category = ?, client_id = ?, owner_id = ?, removed_from = ?, pm_id = ?,
                date_received = ?, charge_date = ?, action_status = ?, notes = ?, updated_by = ?, updated_at = NOW()
             WHERE id = ?",
            'sssiiiissiisissssii',
            [
                $data['make'] ?? '',
                $data['model'] ?? '',
                $data['serial_no'] ?? '',
                (int) ($data['type_id'] ?? 0),
                (int) ($data['qty'] ?? 1),
                (int) ($data['length_mm'] ?? 0),
                (int) ($data['depth_mm'] ?? 0),
                $data['condition_grade'] ?? '',
                $data['stock_category'] ?? '',
                (int) ($data['client_id'] ?? 0),
                (int) ($data['owner_id'] ?? 0),
                $data['removed_from'] ?? '',
                (int) ($data['pm_id'] ?? 0),
                $data['date_received'] ?? null,
                self::normaliseChargeDate($data),
                $data['action_status'] ?? '',
                $data['notes'] ?? '',
                (int) $user['id'],
                $id
            ]
        );

        self::deleteSelectedImages($db, $id, $data['remove_image_ids'] ?? []);

        if (!empty($_FILES['images']) && !empty($_FILES['images']['name'][0])) {
            self::saveImages($db, $id);
        }

        json_response(['message' => 'BookIn updated']);
    }

    public static function archive(mysqli $db, int $id): void
    {
        $user = current_user($db);
        require_admin($user);

        db_execute(
            $db,
            "UPDATE book_ins SET archived = 1, archived_at = NOW() WHERE id = ?",
            'i',
            [$id]
        );

        json_response(['message' => 'BookIn archived']);
    }



    public static function restore(mysqli $db, int $id): void
    {
        $user = current_user($db);
        require_admin($user);

        db_execute(
            $db,
            "UPDATE book_ins SET archived = 0, archived_at = NULL, updated_by = ?, updated_at = NOW() WHERE id = ?",
            'ii',
            [(int) $user['id'], $id]
        );

        json_response(['message' => 'BookIn restored']);
    }

    public static function permanentDelete(mysqli $db, int $id): void
    {
        $user = current_user($db);
        require_admin($user);

        $record = db_first($db, "SELECT id FROM book_ins WHERE id = ? AND archived = 1", 'i', [$id]);

        if (!$record) {
            json_response(['message' => 'Archived BookIn record not found'], 404);
        }

        $images = db_select($db, "SELECT file_path FROM book_in_images WHERE book_in_id = ?", 'i', [$id]);

        db_execute($db, "DELETE FROM stock_activities WHERE book_in_id = ?", 'i', [$id]);
        db_execute($db, "DELETE FROM book_in_images WHERE book_in_id = ?", 'i', [$id]);
        db_execute($db, "DELETE FROM book_ins WHERE id = ? AND archived = 1", 'i', [$id]);

        foreach ($images as $image) {
            $filePath = $image['file_path'] ?? '';
            if (!$filePath) {
                continue;
            }

            $fullPath = realpath(__DIR__ . '/..' . $filePath);
            $uploadRoot = realpath(__DIR__ . '/../uploads');

            if ($fullPath && $uploadRoot && strpos($fullPath, $uploadRoot) === 0 && is_file($fullPath)) {
                @unlink($fullPath);
            }
        }

        json_response(['message' => 'BookIn permanently deleted']);
    }

    public static function resetChargeDateMany(mysqli $db): void
    {
        $user = current_user($db);
        require_admin($user);
        self::ensureChargeDateColumn($db);

        $data = input_json();
        $ids = array_values(array_filter(array_map('intval', $data['ids'] ?? [])));
        $chargeDate = $data['charge_date'] ?? '';

        if (!$ids) {
            json_response(['message' => 'No records selected'], 422);
        }

        if (!$chargeDate || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $chargeDate)) {
            json_response(['message' => 'Valid charge date is required'], 422);
        }

        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $types = 's' . str_repeat('i', count($ids));
        db_execute(
            $db,
            "UPDATE book_ins SET charge_date = ?, updated_by = ?, updated_at = NOW() WHERE id IN ({$placeholders})",
            'si' . str_repeat('i', count($ids)),
            array_merge([$chargeDate, (int) $user['id']], $ids)
        );

        json_response(['message' => 'Charge date reset for selected records']);
    }

    public static function archiveMany(mysqli $db): void
    {
        $user = current_user($db);
        require_admin($user);

        $data = input_json();
        $ids = $data['ids'] ?? [];

        if (!$ids) {
            json_response(['message' => 'No records selected'], 422);
        }

        foreach ($ids as $id) {
            db_execute(
                $db,
                "UPDATE book_ins SET archived = 1, archived_at = NOW() WHERE id = ?",
                'i',
                [(int) $id]
            );
        }

        json_response(['message' => 'Selected records archived']);
    }

    private static function ensureChargeDateColumn(mysqli $db): void
    {
        $column = db_first($db, "SHOW COLUMNS FROM book_ins LIKE 'charge_date'");
        if (!$column) {
            db_execute($db, "ALTER TABLE book_ins ADD COLUMN charge_date DATE NULL AFTER date_received");
            db_execute($db, "UPDATE book_ins SET charge_date = DATE_ADD(date_received, INTERVAL 30 DAY) WHERE charge_date IS NULL AND date_received IS NOT NULL");
        }
    }

    private static function normaliseChargeDate(array $data): ?string
    {
        if (!empty($data['charge_date'])) {
            return $data['charge_date'];
        }

        if (!empty($data['date_received'])) {
            $date = DateTime::createFromFormat('Y-m-d', $data['date_received']);
            if ($date) {
                $date->modify('+30 days');
                return $date->format('Y-m-d');
            }
        }

        return null;
    }

    private static function generateStockCode(mysqli $db): string
    {
        $last = db_first($db, "SELECT stock_code FROM book_ins ORDER BY id DESC LIMIT 1");
        $number = 1;

        if ($last && preg_match('/(\d+)/', $last['stock_code'], $matches)) {
            $number = (int) $matches[1] + 1;
        }

        return 'A - ' . str_pad((string) $number, 4, '0', STR_PAD_LEFT);
    }

    private static function deleteSelectedImages(mysqli $db, int $bookInId, array $imageIds): void
    {
        $imageIds = array_values(array_filter(array_map('intval', $imageIds)));

        if (!$imageIds) {
            return;
        }

        foreach ($imageIds as $imageId) {
            $image = db_first(
                $db,
                "SELECT id, file_path FROM book_in_images WHERE id = ? AND book_in_id = ?",
                'ii',
                [$imageId, $bookInId]
            );

            if (!$image) {
                continue;
            }

            db_execute($db, "DELETE FROM book_in_images WHERE id = ? AND book_in_id = ?", 'ii', [$imageId, $bookInId]);

            $filePath = $image['file_path'] ?? '';
            if (!$filePath) {
                continue;
            }

            $fullPath = realpath(__DIR__ . '/..' . $filePath);
            $uploadRoot = realpath(__DIR__ . '/../uploads');

            if ($fullPath && $uploadRoot && strpos($fullPath, $uploadRoot) === 0 && is_file($fullPath)) {
                @unlink($fullPath);
            }
        }
    }

    private static function saveImages(mysqli $db, int $bookInId): void
    {
        if (empty($_FILES['images'])) {
            return;
        }

        $uploadDir = __DIR__ . '/../uploads';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $lastSort = db_first($db, "SELECT COALESCE(MAX(sort_order), 0) AS sort_order FROM book_in_images WHERE book_in_id = ?", 'i', [$bookInId]);
        $sortOrder = (int) ($lastSort['sort_order'] ?? 0);
        $count = count($_FILES['images']['name']);

        for ($index = 0; $index < $count; $index++) {
            if ($_FILES['images']['error'][$index] !== UPLOAD_ERR_OK) {
                continue;
            }

            $tmpName = $_FILES['images']['tmp_name'][$index];
            $mimeType = mime_content_type($tmpName);

            if (!in_array($mimeType, ['image/jpeg', 'image/png', 'image/webp'])) {
                continue;
            }

            $extension = match ($mimeType) {
                'image/png' => 'png',
                'image/webp' => 'webp',
                default => 'jpg'
            };

            $fileName = uniqid('bookin_', true) . '.' . $extension;
            move_uploaded_file($tmpName, $uploadDir . '/' . $fileName);

            db_execute(
                $db,
                "INSERT INTO book_in_images (book_in_id, file_path, original_name, sort_order) VALUES (?, ?, ?, ?)",
                'issi',
                [$bookInId, '/uploads/' . $fileName, $_FILES['images']['name'][$index], ++$sortOrder]
            );
        }
    }
}

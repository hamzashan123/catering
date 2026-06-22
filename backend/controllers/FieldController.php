<?php

class FieldController
{
    private static array $tables = [
        'clients' => 'clients',
        'owners' => 'owners',
        'pms' => 'pms',
        'types' => 'appliance_types'
    ];

    private static function table(string $key): string
    {
        if (!isset(self::$tables[$key])) {
            json_response(['message' => 'Invalid field type'], 404);
        }

        return self::$tables[$key];
    }

    public static function index(mysqli $db, string $key): void
    {
        current_user($db);
        $table = self::table($key);

        $rows = db_select($db, "SELECT * FROM {$table} ORDER BY name ASC");

        json_response(['data' => $rows]);
    }

    public static function store(mysqli $db, string $key): void
    {
        $user = current_user($db);
        require_admin($user);

        $table = self::table($key);
        $data = input_json();
        require_fields($data, ['name']);

        $status = $data['status'] ?? 'active';

        db_execute(
            $db,
            "INSERT INTO {$table} (name, status) VALUES (?, ?)",
            'ss',
            [$data['name'], $status]
        );

        json_response(['message' => 'Field created'], 201);
    }


    public static function update(mysqli $db, string $key, int $id): void
    {
        $user = current_user($db);
        require_admin($user);

        $table = self::table($key);
        $data = input_json();
        require_fields($data, ['name']);
        $status = $data['status'] ?? 'active';

        db_execute(
            $db,
            "UPDATE {$table} SET name = ?, status = ? WHERE id = ?",
            'ssi',
            [$data['name'], $status, $id]
        );

        json_response(['message' => 'Field updated']);
    }

    public static function destroy(mysqli $db, string $key, int $id): void
    {
        $user = current_user($db);
        require_admin($user);

        $table = self::table($key);

        db_execute($db, "DELETE FROM {$table} WHERE id = ?", 'i', [$id]);

        json_response(['message' => 'Field deleted']);
    }

    public static function dropdowns(mysqli $db): void
    {
        current_user($db);

        json_response([
            'clients' => db_select($db, "SELECT id, name FROM clients WHERE status = 'active' ORDER BY name ASC"),
            'owners' => db_select($db, "SELECT id, name FROM owners WHERE status = 'active' ORDER BY name ASC"),
            'pms' => db_select($db, "SELECT id, name FROM pms WHERE status = 'active' ORDER BY name ASC"),
            'types' => db_select($db, "SELECT id, name FROM appliance_types WHERE status = 'active' ORDER BY name ASC")
        ]);
    }
}

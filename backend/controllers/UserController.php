<?php

class UserController
{
    public static function index(mysqli $db): void
    {
        $user = current_user($db);
        require_admin($user);

        $users = db_select(
            $db,
            "SELECT id, name, email, username, role, status, created_at FROM users ORDER BY id DESC"
        );

        json_response(['data' => $users]);
    }

    public static function store(mysqli $db): void
    {
        $user = current_user($db);
        require_admin($user);

        $data = input_json();
        require_fields($data, ['name', 'email', 'username', 'password', 'role']);

        $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
        $status = $data['status'] ?? 'active';

        db_execute(
            $db,
            "INSERT INTO users (name, email, username, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)",
            'ssssss',
            [$data['name'], $data['email'], $data['username'], $passwordHash, $data['role'], $status]
        );

        json_response(['message' => 'User created'], 201);
    }

    public static function update(mysqli $db, int $id): void
    {
        $user = current_user($db);
        require_admin($user);

        $data = input_json();
        require_fields($data, ['name', 'email', 'username', 'role', 'status']);

        $existing = db_first(
            $db,
            "SELECT id FROM users WHERE username = ? AND id <> ? LIMIT 1",
            'si',
            [$data['username'], $id]
        );

        if ($existing) {
            json_response(['message' => 'Username is already taken'], 422);
        }

        if (!empty($data['password'])) {
            $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
            db_execute(
                $db,
                "UPDATE users SET name = ?, email = ?, username = ?, role = ?, status = ?, password_hash = ? WHERE id = ?",
                'ssssssi',
                [$data['name'], $data['email'], $data['username'], $data['role'], $data['status'], $passwordHash, $id]
            );
        } else {
            db_execute(
                $db,
                "UPDATE users SET name = ?, email = ?, username = ?, role = ?, status = ? WHERE id = ?",
                'sssssi',
                [$data['name'], $data['email'], $data['username'], $data['role'], $data['status'], $id]
            );
        }

        json_response(['message' => 'User updated']);
    }

    public static function destroy(mysqli $db, int $id): void
    {
        $user = current_user($db);
        require_admin($user);

        db_execute(
            $db,
            "DELETE FROM users WHERE id = ? AND id <> ?",
            'ii',
            [$id, (int) $user['id']]
        );

        json_response(['message' => 'User deleted']);
    }
}

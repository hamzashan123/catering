<?php

class AuthController
{
    public static function login(mysqli $db): void
    {
        $data = input_json();
        require_fields($data, ['username', 'password']);

        $user = db_first(
            $db,
            "SELECT * FROM users WHERE username = ? AND status = 'active' LIMIT 1",
            's',
            [$data['username']]
        );

        if (!$user || !password_verify($data['password'], $user['password_hash'])) {
            json_response(['message' => 'Invalid login details'], 401);
        }

        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);

        db_execute(
            $db,
            "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))",
            'is',
            [(int) $user['id'], $tokenHash]
        );

        unset($user['password_hash']);

        json_response(['token' => $token, 'user' => $user]);
    }

    public static function me(mysqli $db): void
    {
        $user = current_user($db);
        json_response(['user' => $user]);
    }

    public static function updateProfile(mysqli $db): void
    {
        $user = current_user($db);
        $data = input_json();
        require_fields($data, ['name', 'email', 'username']);

        $existing = db_first(
            $db,
            "SELECT id FROM users WHERE username = ? AND id <> ? LIMIT 1",
            'si',
            [$data['username'], (int) $user['id']]
        );

        if ($existing) {
            json_response(['message' => 'Username is already taken'], 422);
        }

        if (!empty($data['password'])) {
            $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
            db_execute(
                $db,
                "UPDATE users SET name = ?, email = ?, username = ?, password_hash = ? WHERE id = ?",
                'ssssi',
                [$data['name'], $data['email'], $data['username'], $passwordHash, (int) $user['id']]
            );
        } else {
            db_execute(
                $db,
                "UPDATE users SET name = ?, email = ?, username = ? WHERE id = ?",
                'sssi',
                [$data['name'], $data['email'], $data['username'], (int) $user['id']]
            );
        }

        json_response(['message' => 'Profile updated']);
    }
}

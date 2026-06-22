<?php

class DashboardController
{
    public static function stats(mysqli $db): void
    {
        current_user($db);

        $active = db_first($db, "SELECT COUNT(*) total FROM book_ins WHERE archived = 0")['total'] ?? 0;
        $archived = db_first($db, "SELECT COUNT(*) total FROM book_ins WHERE archived = 1")['total'] ?? 0;
        $clients = db_first($db, "SELECT COUNT(*) total FROM clients")['total'] ?? 0;
        $users = db_first($db, "SELECT COUNT(*) total FROM users")['total'] ?? 0;

        json_response([
            'active' => (int) $active,
            'archived' => (int) $archived,
            'clients' => (int) $clients,
            'users' => (int) $users
        ]);
    }
}

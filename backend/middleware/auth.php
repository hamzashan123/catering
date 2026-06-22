<?php

function get_authorization_header(): string
{
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        return $_SERVER['HTTP_AUTHORIZATION'];
    }

    if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }

    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();

        foreach ($headers as $key => $value) {
            if (strtolower($key) === 'authorization') {
                return $value;
            }
        }
    }

    if (!empty($_SERVER['PHP_AUTH_DIGEST'])) {
        return $_SERVER['PHP_AUTH_DIGEST'];
    }

    if (!empty($_SERVER['PHP_AUTH_USER']) && !empty($_SERVER['PHP_AUTH_PW'])) {
        return 'Basic ' . base64_encode($_SERVER['PHP_AUTH_USER'] . ':' . $_SERVER['PHP_AUTH_PW']);
    }

    return '';
}

function get_bearer_token(): string
{
    $header = trim(get_authorization_header());

    if ($header === '') {
        return '';
    }

    if (stripos($header, 'Bearer ') === 0) {
        return trim(substr($header, 7));
    }

    return $header;
}

function current_user(mysqli $db): array
{
    $token = get_bearer_token();

    if ($token === '') {
        json_response(['message' => 'Authentication required'], 401);
    }

    $tokenHash = hash('sha256', $token);

    $user = db_first(
        $db,
        "SELECT u.id, u.name, u.email, u.username, u.role, u.status
         FROM sessions s
         INNER JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > NOW() AND u.status = 'active'
         LIMIT 1",
        's',
        [$tokenHash]
    );

    if (!$user) {
        json_response(['message' => 'Invalid or expired session'], 401);
    }

    return $user;
}

function require_admin(array $user): void
{
    if (($user['role'] ?? '') !== 'admin') {
        json_response(['message' => 'Admin access required'], 403);
    }
}

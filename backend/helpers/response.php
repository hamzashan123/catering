<?php

function json_response(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function input_json(): array
{
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);

    return is_array($data) ? $data : [];
}

function require_fields(array $data, array $fields): void
{
    foreach ($fields as $field) {
        if (!isset($data[$field]) || $data[$field] === '') {
            json_response(['message' => "{$field} is required"], 422);
        }
    }
}

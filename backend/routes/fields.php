<?php

if ($path === '/dropdowns' && $method === 'GET') {
    FieldController::dropdowns($db);
}

if (($segments[0] ?? '') === 'fields' && isset($segments[1]) && $method === 'GET') {
    FieldController::index($db, $segments[1]);
}

if (($segments[0] ?? '') === 'fields' && isset($segments[1]) && $method === 'POST') {
    FieldController::store($db, $segments[1]);
}

if (($segments[0] ?? '') === 'fields' && isset($segments[1], $segments[2]) && $method === 'PUT') {
    FieldController::update($db, $segments[1], (int) $segments[2]);
}

if (($segments[0] ?? '') === 'fields' && isset($segments[1], $segments[2]) && $method === 'DELETE') {
    FieldController::destroy($db, $segments[1], (int) $segments[2]);
}

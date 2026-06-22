<?php

if ($path === '/users' && $method === 'GET') {
    UserController::index($db);
}

if ($path === '/users' && $method === 'POST') {
    UserController::store($db);
}

if (($segments[0] ?? '') === 'users' && isset($segments[1]) && $method === 'PUT') {
    UserController::update($db, (int) $segments[1]);
}

if (($segments[0] ?? '') === 'users' && isset($segments[1]) && $method === 'DELETE') {
    UserController::destroy($db, (int) $segments[1]);
}

<?php

if ($path === '/auth/login' && $method === 'POST') {
    AuthController::login($db);
}

if ($path === '/auth/me' && $method === 'GET') {
    AuthController::me($db);
}

if ($path === '/auth/profile' && $method === 'PUT') {
    AuthController::updateProfile($db);
}

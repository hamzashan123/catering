<?php

if ($path === '/bookins/reset-charge-date' && $method === 'POST') {
    BookInController::resetChargeDateMany($db);
}

if ($path === '/bookins/archive' && $method === 'POST') {
    BookInController::archiveMany($db);
}

if ($path === '/bookins' && $method === 'GET') {
    BookInController::index($db);
}

if ($path === '/bookins' && $method === 'POST') {
    BookInController::store($db);
}


if (($segments[0] ?? '') === 'bookins' && isset($segments[1]) && ($segments[2] ?? '') === 'restore' && $method === 'POST') {
    BookInController::restore($db, (int) $segments[1]);
}

if (($segments[0] ?? '') === 'bookins' && isset($segments[1]) && ($segments[2] ?? '') === 'delete' && $method === 'DELETE') {
    BookInController::permanentDelete($db, (int) $segments[1]);
}

if (($segments[0] ?? '') === 'bookins' && isset($segments[1]) && $method === 'GET') {
    BookInController::show($db, (int) $segments[1]);
}

if (($segments[0] ?? '') === 'bookins' && isset($segments[1]) && $method === 'POST') {
    BookInController::update($db, (int) $segments[1]);
}

if (($segments[0] ?? '') === 'bookins' && isset($segments[1]) && $method === 'DELETE') {
    BookInController::archive($db, (int) $segments[1]);
}

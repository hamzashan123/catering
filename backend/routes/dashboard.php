<?php

if ($path === '/dashboard/stats' && $method === 'GET') {
    DashboardController::stats($db);
}

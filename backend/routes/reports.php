<?php

if ($path === '/reports/list' && $method === 'GET') {
    ReportController::list($db);
}

if ($path === '/reports/image' && $method === 'GET') {
    ReportController::image($db);
}

<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

Route::get('/api/health-check', function () {
    $results = [
        'api' => 'Status OK',
        'database' => 'Unknown',
        'database_error' => null,
        'php_version' => PHP_VERSION,
        'env' => app()->environment(),
    ];

    try {
        DB::connection()->getPdo();
        $results['database'] = 'Connected successfully to ' . DB::connection()->getDatabaseName();
    } catch (\Exception $e) {
        $results['database'] = 'Connection failed';
        $results['database_error'] = $e->getMessage();
    }

    return response()->json($results);
});

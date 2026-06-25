<?php

use Illuminate\Support\Facades\Route;

require __DIR__.'/health.php';

// Serve React Frontend for all non-api routes
Route::get('/{any?}', function () {
    $path = public_path('index.html');
    if (file_exists($path)) {
        return file_get_contents($path);
    }
    return response()->json(['error' => 'Frontend index.html not found at ' . $path], 404);
})->where('any', '^(?!api).*$');

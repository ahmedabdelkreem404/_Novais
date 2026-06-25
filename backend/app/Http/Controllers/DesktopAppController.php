<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DesktopAppController extends Controller
{
    public function download()
    {
        // Serve the real Electron installer
        $path = public_path('NOVAIS_Installer.exe');
        
        if (!file_exists($path)) {
            // Fallback to placeholder if build hasn't run yet
            return response()->json([
                'message' => 'Installer is currently being built. Please try again later.',
                'status' => 'building'
            ], 404);
        }

        return response()->download($path, 'NOVAIS_Installer.exe');
    }
}

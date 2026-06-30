<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:mp4,mov,avi,wmv,mpeg,png,jpg,jpeg,gif,webp,exe,apk,zip,ico,svg|max:512000',
        ]);

        $path = $request->file('file')->store('media', 'public');
        $url = '/storage/' . $path;

        return response()->json([
            'url' => $url,
            'absolute_url' => asset($url),
        ]);
    }
}

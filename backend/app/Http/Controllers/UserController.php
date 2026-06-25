<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    public function toggleDarkMode(Request $request)
    {
        $user = Auth::user();
        $user->dark_mode = !$user->dark_mode;
        $user->save();
        
        return response()->json([
            'success' => true,
            'dark_mode' => $user->dark_mode,
            'message' => 'user.theme_updated'
        ]);
    }
}

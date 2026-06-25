<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PolicyController extends Controller
{
    public function index()
    {
        // Return dummy policies for MVP or fetch from DB if Pages table is populated
        return response()->json([
            [
                'terms' => 'Terms and Conditions content...',
                'privacy' => 'Privacy Policy content...'
            ]
        ]);
    }
}

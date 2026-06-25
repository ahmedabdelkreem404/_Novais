<?php

namespace App\Http\Controllers;

use App\Models\SocialLink;
use Illuminate\Http\Request;

class SocialLinkController extends Controller
{
    /**
     * Public index for active social links.
     */
    public function index()
    {
        return response()->json(SocialLink::where('is_active', true)->get());
    }

    /**
     * Admin index for all social links.
     */
    public function adminIndex()
    {
        return response()->json(SocialLink::latest()->get());
    }

    /**
     * Create a new social link.
     */
    public function store(Request $request)
    {
        $request->validate([
            'platform' => 'required|string',
            'url' => 'required|url',
            'is_active' => 'boolean'
        ]);

        $link = SocialLink::create($request->all());

        return response()->json($link, 201);
    }

    /**
     * Update an existing social link.
     */
    public function update(Request $request, $id)
    {
        $link = SocialLink::findOrFail($id);

        $request->validate([
            'platform' => 'sometimes|string',
            'url' => 'sometimes|url',
            'is_active' => 'sometimes|boolean'
        ]);

        $link->update($request->all());

        return response()->json($link);
    }

    /**
     * Delete a social link.
     */
    public function destroy($id)
    {
        SocialLink::destroy($id);
        return response()->json(['message' => 'common.deleted']);
    }
}

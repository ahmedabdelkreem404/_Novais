<?php

namespace App\Http\Controllers;

use App\Models\Page;
use App\Support\HtmlSanitizer;
use Illuminate\Http\Request;

class PageController extends Controller
{
    public function show($slug)
    {
        $page = Page::firstOrCreate(
            ['slug' => $slug],
            [
                'title' => ucfirst($slug), 
                'title_ar' => ucfirst($slug), // Default Arabic title
                'content' => '<h1>' . ucfirst($slug) . '</h1><p>common.content_coming_soon</p>',
                'content_ar' => '<h1>' . ucfirst($slug) . '</h1><p>common.content_coming_soon</p>'
            ]
        );

        return response()->json($page);
    }

    public function update(Request $request, $slug)
    {
        $page = Page::where('slug', $slug)->firstOrFail();

        $request->validate([
            'content' => 'nullable|string',
            'content_ar' => 'nullable|string',
            'title' => 'nullable|string',
            'title_ar' => 'nullable|string',
        ]);

        $data = $request->only(['content', 'content_ar', 'title', 'title_ar']);
        foreach (['content', 'content_ar'] as $field) {
            if (array_key_exists($field, $data)) {
                $data[$field] = HtmlSanitizer::clean($data[$field]);
            }
        }

        $page->update($data);

        return response()->json($page);
    }
}

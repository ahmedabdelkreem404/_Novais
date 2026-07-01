<?php

namespace App\Http\Controllers;

use App\Models\Blog;
use App\Models\Page;
use App\Support\HtmlSanitizer;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CMSController extends Controller
{
    // Public Access
    public function getBlogs()
    {
        return response()->json(Blog::latest()->paginate(10));
    }

    public function getBlog($slug)
    {
        return response()->json(Blog::where('slug', $slug)->firstOrFail());
    }

    public function getPage($slug)
    {
        $page = Page::firstOrCreate(
            ['slug' => $slug],
            ['title' => ucfirst($slug), 'content' => '<h1>' . ucfirst($slug) . '</h1><p>Content coming soon...</p>']
        );
        return response()->json($page);
    }

    public function getPlans()
    {
        return response()->json(\App\Models\Plan::all());
    }

    // Admin Access
    public function storeBlog(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'title_ar' => 'nullable|string',
            'content' => 'required|string',
            'content_ar' => 'nullable|string',
            'slug' => 'nullable|string|unique:blogs,slug',
        ]);

        $slug = $request->slug ? Str::slug($request->slug) : Str::slug($request->title);

        // Ensure slug is not empty
        if (empty($slug)) {
            $slug = Str::random(10);
        }

        $blog = Blog::create([
            'title' => $request->title,
            'title_ar' => $request->title_ar,
            'slug' => $slug,
            'content' => HtmlSanitizer::clean($request->content),
            'content_ar' => $request->content_ar ? HtmlSanitizer::clean($request->content_ar) : null,
            'image' => $request->image,
            'meta_title' => $request->meta_title,
            'meta_description' => $request->meta_description,
        ]);

        return response()->json($blog, 201);
    }

    public function updateBlog(Request $request, $id)
    {
        $blog = Blog::findOrFail($id);
        $data = $request->only(['title', 'title_ar', 'slug', 'content', 'content_ar', 'image', 'meta_title', 'meta_description']);
        if (array_key_exists('slug', $data) && $data['slug']) {
            $data['slug'] = Str::slug($data['slug']);
        }
        if (array_key_exists('content', $data)) {
            $data['content'] = HtmlSanitizer::clean($data['content']);
        }
        if (array_key_exists('content_ar', $data) && $data['content_ar']) {
            $data['content_ar'] = HtmlSanitizer::clean($data['content_ar']);
        }
        $blog->update($data);
        return response()->json($blog);
    }

    public function deleteBlog($id)
    {
        Blog::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }

    public function updatePage(Request $request, $slug)
    {
        // For pages like 'terms', 'privacy' which are predefined slugs usually
        $page = Page::firstOrCreate(['slug' => $slug], ['title' => ucfirst($slug)]);
        $page->update([
            'content' => HtmlSanitizer::clean($request->content),
            'title' => $request->title ?? $page->title
        ]);
        return response()->json($page);
    }
}

<?php

namespace Tests\Feature;

use App\Models\Page;
use App\Support\HtmlSanitizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CmsSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_page_update_route_is_not_available(): void
    {
        Page::create([
            'slug' => 'privacy',
            'title' => 'Privacy',
            'content' => 'Original',
        ]);

        $this->postJson('/api/pages/privacy', ['content' => 'Changed'])
            ->assertStatus(405);

        $this->assertDatabaseHas('pages', [
            'slug' => 'privacy',
            'content' => 'Original',
        ]);
    }

    public function test_html_sanitizer_removes_executable_content(): void
    {
        $dirty = '<h1 onclick="alert(1)">Title</h1><script>alert(1)</script><a href="javascript:alert(1)">bad</a><p>Safe</p>';
        $clean = HtmlSanitizer::clean($dirty);

        $this->assertStringContainsString('<h1>Title</h1>', $clean);
        $this->assertStringContainsString('<p>Safe</p>', $clean);
        $this->assertStringNotContainsString('<script', $clean);
        $this->assertStringNotContainsString('onclick', $clean);
        $this->assertStringNotContainsString('javascript:', $clean);
    }
}

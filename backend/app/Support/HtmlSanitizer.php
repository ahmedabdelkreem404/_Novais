<?php

namespace App\Support;

class HtmlSanitizer
{
    private const ALLOWED_TAGS = '<p><br><strong><b><em><i><u><s><ul><ol><li><blockquote><h1><h2><h3><h4><h5><h6><a><img><table><thead><tbody><tr><th><td><hr><pre><code>';

    public static function clean(?string $html): ?string
    {
        if ($html === null) {
            return null;
        }

        $clean = strip_tags($html, self::ALLOWED_TAGS);
        $clean = preg_replace('/\s+on[a-z]+\s*=\s*(".*?"|\'.*?\'|[^\s>]+)/i', '', $clean);
        $clean = preg_replace('/\s+(href|src)\s*=\s*([\'"])\s*javascript:.*?\2/i', '', $clean);
        $clean = preg_replace('/\s+(href|src)\s*=\s*javascript:[^\s>]+/i', '', $clean);
        $clean = preg_replace('/<iframe\b[^>]*>.*?<\/iframe>/is', '', $clean);
        $clean = preg_replace('/<object\b[^>]*>.*?<\/object>/is', '', $clean);
        $clean = preg_replace('/<embed\b[^>]*>/is', '', $clean);

        return $clean;
    }
}

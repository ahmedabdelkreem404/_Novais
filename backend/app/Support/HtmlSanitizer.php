<?php

namespace App\Support;

class HtmlSanitizer
{
    public static function clean(?string $html): ?string
    {
        if ($html === null) {
            return null;
        }

        $config = \HTMLPurifier_Config::createDefault();
        $config->set('Cache.SerializerPath', storage_path('framework/cache/htmlpurifier'));
        $config->set('HTML.Allowed', implode(',', [
            'p[style|class]',
            'br',
            'strong',
            'b',
            'em',
            'i',
            'u',
            's',
            'ul[class]',
            'ol[class]',
            'li[class]',
            'blockquote[class]',
            'h1[class]',
            'h2[class]',
            'h3[class]',
            'h4[class]',
            'h5[class]',
            'h6[class]',
            'a[href|title|target|rel|class]',
            'img[src|alt|title|width|height|class]',
            'table[class]',
            'thead[class]',
            'tbody[class]',
            'tr[class]',
            'th[class|colspan|rowspan]',
            'td[class|colspan|rowspan]',
            'hr',
            'pre[class]',
            'code[class]',
            'span[class|style]',
        ]));
        $config->set('CSS.AllowedProperties', [
            'text-align',
            'font-weight',
            'font-style',
            'text-decoration',
            'color',
            'background-color',
        ]);
        $config->set('URI.AllowedSchemes', [
            'http' => true,
            'https' => true,
            'mailto' => true,
        ]);
        $config->set('Attr.AllowedFrameTargets', ['_blank']);
        $config->set('HTML.TargetBlank', true);
        $config->set('HTML.Nofollow', true);
        $config->set('AutoFormat.RemoveEmpty', true);

        if (!is_dir(storage_path('framework/cache/htmlpurifier'))) {
            mkdir(storage_path('framework/cache/htmlpurifier'), 0775, true);
        }

        return (new \HTMLPurifier($config))->purify($html);
    }
}

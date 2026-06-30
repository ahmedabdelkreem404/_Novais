<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ContentBlueprint extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'enabled',
        'sort_order',
        'language_support',
        'target_academic_level',
        'output_structure',
        'required_sections',
        'optional_sections',
        'default_count',
        'assessment_rules',
        'media_rules',
        'citation_rules',
        'tone_rules',
        'output_format_rules',
        'prompt_instructions',
        'validation_schema',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'sort_order' => 'integer',
        'language_support' => 'array',
        'output_structure' => 'array',
        'required_sections' => 'array',
        'optional_sections' => 'array',
        'default_count' => 'integer',
        'assessment_rules' => 'array',
        'media_rules' => 'array',
        'citation_rules' => 'array',
        'tone_rules' => 'array',
        'output_format_rules' => 'array',
        'validation_schema' => 'array',
    ];

    public static function defaults(): array
    {
        $types = [
            ['normal course', 'normal-course', ['overview', 'chapters', 'lessons', 'practice']],
            ['leveled course', 'leveled-course', ['level map', 'chapters', 'lessons', 'checkpoints']],
            ['exam', 'exam', ['instructions', 'sections', 'questions', 'answer key']],
            ['research paper', 'research-paper', ['abstract', 'introduction', 'methodology', 'findings', 'references']],
            ['book', 'book', ['preface', 'chapters', 'exercises', 'summary']],
            ['graduation project', 'graduation-project', ['proposal', 'requirements', 'architecture', 'implementation', 'evaluation']],
            ['academic lecture', 'academic-lecture', ['objectives', 'lecture notes', 'examples', 'discussion prompts']],
            ['workshop', 'workshop', ['agenda', 'hands-on labs', 'facilitator notes', 'outcomes']],
            ['assignment', 'assignment', ['brief', 'requirements', 'rubric', 'submission format']],
            ['study plan', 'study-plan', ['goals', 'weekly schedule', 'resources', 'milestones']],
            ['quiz bank', 'quiz-bank', ['categories', 'questions', 'answers', 'difficulty tags']],
            ['lesson plan', 'lesson-plan', ['objectives', 'activities', 'assessment', 'materials']],
        ];

        return collect($types)->map(function ($item, $index) {
            [$name, $slug, $sections] = $item;

            return [
                'name' => Str::title($name),
                'slug' => $slug,
                'enabled' => true,
                'sort_order' => $index + 1,
                'language_support' => ['English', 'Arabic'],
                'target_academic_level' => 'general',
                'output_structure' => [
                    'type' => $slug,
                    'sections' => $sections,
                    'must_return_json' => true,
                ],
                'required_sections' => $sections,
                'optional_sections' => ['media suggestions', 'practice prompts'],
                'default_count' => in_array($slug, ['book', 'research-paper', 'graduation-project'], true) ? 8 : 5,
                'assessment_rules' => [
                    'include_quiz' => in_array($slug, ['normal-course', 'leveled-course', 'academic-lecture', 'workshop', 'lesson-plan'], true),
                    'style' => 'scenario based where relevant',
                ],
                'media_rules' => ['prefer_instructional_media' => true, 'avoid_decorative_media' => true],
                'citation_rules' => ['required' => in_array($slug, ['research-paper', 'book', 'graduation-project'], true)],
                'tone_rules' => ['style' => 'clear, educational, academically responsible'],
                'output_format_rules' => ['format' => 'structured JSON compatible with NOVAIS course metadata'],
                'prompt_instructions' => "Generate a {$name} with explicit structure, practical educational value, and language-appropriate labels. Follow the required sections exactly.",
                'validation_schema' => ['required' => ['title', 'description', 'chapters']],
            ];
        })->all();
    }

    public function toPublicArray(): array
    {
        return [
            'name' => $this->name,
            'slug' => $this->slug,
            'enabled' => $this->enabled,
            'language_support' => $this->language_support ?? [],
            'target_academic_level' => $this->target_academic_level,
            'output_structure' => $this->output_structure ?? [],
            'default_count' => $this->default_count,
        ];
    }

    public function promptBlock(): string
    {
        return trim(json_encode([
            'blueprint' => $this->slug,
            'name' => $this->name,
            'target_academic_level' => $this->target_academic_level,
            'output_structure' => $this->output_structure,
            'required_sections' => $this->required_sections,
            'optional_sections' => $this->optional_sections,
            'assessment_rules' => $this->assessment_rules,
            'media_rules' => $this->media_rules,
            'citation_rules' => $this->citation_rules,
            'tone_rules' => $this->tone_rules,
            'output_format_rules' => $this->output_format_rules,
            'prompt_instructions' => $this->prompt_instructions,
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    }
}

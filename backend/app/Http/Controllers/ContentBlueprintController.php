<?php

namespace App\Http\Controllers;

use App\Models\ContentBlueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class ContentBlueprintController extends Controller
{
    public function index()
    {
        return response()->json(ContentBlueprint::query()
            ->where('enabled', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (ContentBlueprint $blueprint) => $blueprint->toPublicArray())
            ->values());
    }

    public function adminIndex()
    {
        return response()->json(ContentBlueprint::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get());
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $blueprint = ContentBlueprint::create($data);

        Log::info('content_blueprints.created', [
            'admin_id' => auth('api')->id(),
            'blueprint_slug' => $blueprint->slug,
        ]);

        return response()->json($blueprint, 201);
    }

    public function update(Request $request, ContentBlueprint $contentBlueprint)
    {
        $data = $this->validated($request, $contentBlueprint->id);
        $contentBlueprint->update($data);

        Log::info('content_blueprints.updated', [
            'admin_id' => auth('api')->id(),
            'blueprint_slug' => $contentBlueprint->slug,
        ]);

        return response()->json($contentBlueprint->fresh());
    }

    public function destroy(ContentBlueprint $contentBlueprint)
    {
        $contentBlueprint->update(['enabled' => false]);

        Log::info('content_blueprints.disabled', [
            'admin_id' => auth('api')->id(),
            'blueprint_slug' => $contentBlueprint->slug,
        ]);

        return response()->json(['success' => true, 'disabled' => true]);
    }

    private function validated(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                'alpha_dash',
                Rule::unique('content_blueprints', 'slug')->ignore($ignoreId),
            ],
            'enabled' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'language_support' => ['sometimes', 'nullable', 'array'],
            'language_support.*' => ['string'],
            'target_academic_level' => ['sometimes', 'nullable', 'string', 'max:255'],
            'output_structure' => ['required', 'array'],
            'required_sections' => ['sometimes', 'nullable', 'array'],
            'required_sections.*' => ['string'],
            'optional_sections' => ['sometimes', 'nullable', 'array'],
            'optional_sections.*' => ['string'],
            'default_count' => ['sometimes', 'integer', 'min:1', 'max:50'],
            'assessment_rules' => ['sometimes', 'nullable', 'array'],
            'media_rules' => ['sometimes', 'nullable', 'array'],
            'citation_rules' => ['sometimes', 'nullable', 'array'],
            'tone_rules' => ['sometimes', 'nullable', 'array'],
            'output_format_rules' => ['sometimes', 'nullable', 'array'],
            'prompt_instructions' => ['required', 'string', 'max:10000'],
            'validation_schema' => ['sometimes', 'nullable', 'array'],
            'form_schema' => ['sometimes', 'nullable', 'array'],
            'form_schema.fields' => ['sometimes', 'array'],
            'form_schema.fields.*.key' => ['required_with:form_schema.fields', 'string', 'max:80', 'alpha_dash'],
            'form_schema.fields.*.type' => ['required_with:form_schema.fields', 'string', 'max:40'],
            'form_schema.fields.*.label' => ['sometimes', 'array'],
            'form_schema.fields.*.label.en' => ['sometimes', 'string', 'max:120'],
            'form_schema.fields.*.label.ar' => ['sometimes', 'string', 'max:120'],
            'form_schema.fields.*.required' => ['sometimes', 'boolean'],
            'form_schema.fields.*.placeholder' => ['sometimes', 'nullable', 'string', 'max:255'],
            'form_schema.fields.*.options' => ['sometimes', 'array'],
            'form_schema.fields.*.options.*' => ['string', 'max:120'],
        ]);
    }
}

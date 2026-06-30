import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { LuCopy, LuEye, LuPlus, LuSave, LuToggleLeft, LuToggleRight } from 'react-icons/lu';
import { serverURL } from '../constants';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const emptyBlueprint = {
  name: '',
  slug: '',
  enabled: true,
  sort_order: 0,
  language_support: ['English', 'Arabic'],
  target_academic_level: 'general',
  output_structure: { sections: ['overview', 'chapters', 'lessons'] },
  required_sections: ['overview', 'chapters', 'lessons'],
  optional_sections: [],
  default_count: 5,
  assessment_rules: { include_quiz: true },
  media_rules: { prefer_instructional_media: true },
  citation_rules: { required: false },
  tone_rules: { style: 'clear and educational' },
  output_format_rules: { format: 'structured JSON' },
  prompt_instructions: '',
  validation_schema: { required: ['title', 'description', 'chapters'] },
};

const authConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

const parseJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const ContentBlueprints = () => {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const form = useMemo(() => selected || emptyBlueprint, [selected]);

  const load = async () => {
    const res = await axios.get(`${serverURL}/admin/content-blueprints`, authConfig());
    setItems(res.data || []);
    setSelected((current) => current || res.data?.[0] || emptyBlueprint);
  };

  useEffect(() => {
    load().catch(() => toast.error('Failed to load content blueprints'));
  }, []);

  const updateField = (key, value) => setSelected((current) => ({ ...(current || emptyBlueprint), [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.id) {
        await axios.put(`${serverURL}/admin/content-blueprints/${payload.id}`, payload, authConfig());
      } else {
        await axios.post(`${serverURL}/admin/content-blueprints`, payload, authConfig());
      }
      toast.success('Content blueprint saved');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save content blueprint');
    } finally {
      setSaving(false);
    }
  };

  const duplicate = () => {
    setSelected({
      ...form,
      id: undefined,
      name: `${form.name} Copy`,
      slug: `${form.slug}-copy`,
      sort_order: (Number(form.sort_order) || 0) + 1,
    });
  };

  const toggleEnabled = () => updateField('enabled', !form.enabled);

  const JsonArea = ({ label, field }) => (
    <label className="block space-y-2">
      <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">{label}</span>
      <textarea
        value={JSON.stringify(form[field] ?? null, null, 2)}
        onChange={(e) => updateField(field, parseJson(e.target.value, form[field]))}
        className="min-h-[120px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-xs text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
      />
    </label>
  );

  return (
    <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-1 sm:px-4 lg:grid-cols-[300px_1fr]">
      <Card className="p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-black text-gray-900 dark:text-white">AI Blueprints</h2>
          <button
            type="button"
            onClick={() => setSelected(emptyBlueprint)}
            className="rounded-lg bg-blue-600 p-2 text-white"
            title="Create blueprint"
          >
            <LuPlus size={16} />
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className={`w-full rounded-lg border p-3 text-start text-sm transition ${form.id === item.id ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-200' : 'border-gray-100 bg-white text-gray-700 hover:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-gray-200'}`}
            >
              <span className="block truncate font-bold">{item.name}</span>
              <span className="block truncate text-xs opacity-70">{item.slug}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Name</span>
              <input value={form.name} onChange={(e) => updateField('name', e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" />
            </label>
            <label className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Slug</span>
              <input value={form.slug} onChange={(e) => updateField('slug', e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" />
            </label>
            <label className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Academic level</span>
              <input value={form.target_academic_level || ''} onChange={(e) => updateField('target_academic_level', e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" />
            </label>
            <label className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Default count</span>
              <input type="number" min="1" value={form.default_count || 5} onChange={(e) => updateField('default_count', Number(e.target.value))} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" />
            </label>
          </div>

          <label className="mt-4 block space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Prompt instructions</span>
            <textarea value={form.prompt_instructions || ''} onChange={(e) => updateField('prompt_instructions', e.target.value)} className="min-h-[130px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" />
          </label>
        </Card>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <JsonArea label="Output structure" field="output_structure" />
          <JsonArea label="Required sections" field="required_sections" />
          <JsonArea label="Assessment rules" field="assessment_rules" />
          <JsonArea label="Media and citation rules" field="media_rules" />
        </div>

        {preview && (
          <Card className="p-4">
            <pre className="max-h-[340px] overflow-auto whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-200">
              {JSON.stringify({
                blueprint: form.slug,
                output_structure: form.output_structure,
                required_sections: form.required_sections,
                assessment_rules: form.assessment_rules,
                prompt_instructions: form.prompt_instructions,
              }, null, 2)}
            </pre>
          </Card>
        )}

        <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-gray-100 bg-white/90 py-3 backdrop-blur dark:border-white/10 dark:bg-gray-950/90">
          <Button onClick={toggleEnabled} variant="secondary" className="gap-2">
            {form.enabled ? <LuToggleRight size={18} /> : <LuToggleLeft size={18} />}
            {form.enabled ? 'Enabled' : 'Disabled'}
          </Button>
          <Button onClick={duplicate} variant="secondary" className="gap-2"><LuCopy size={18} /> Duplicate</Button>
          <Button onClick={() => setPreview((value) => !value)} variant="secondary" className="gap-2"><LuEye size={18} /> Preview</Button>
          <Button onClick={save} disabled={saving} className="gap-2"><LuSave size={18} /> {saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </div>
    </div>
  );
};

export default ContentBlueprints;

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  LuCopy,
  LuEye,
  LuEyeOff,
  LuPlus,
  LuSave,
  LuSettings2,
  LuToggleLeft,
  LuToggleRight,
  LuTrash2,
} from 'react-icons/lu';
import { serverURL } from '../constants';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const defaultField = () => ({
  key: `field_${Date.now()}`,
  type: 'text',
  label: { en: 'New field', ar: 'حقل جديد' },
  required: false,
  placeholder: '',
  options: [],
});

const emptyBlueprint = {
  name: '',
  slug: '',
  enabled: true,
  sort_order: 0,
  language_support: ['English', 'Arabic'],
  target_academic_level: 'general',
  output_structure: { sections: ['overview', 'chapters', 'lessons'], must_return_json: true },
  required_sections: ['overview', 'chapters', 'lessons'],
  optional_sections: [],
  default_count: 5,
  assessment_rules: { include_quiz: true, style: 'scenario based where relevant' },
  media_rules: { prefer_instructional_media: true, avoid_decorative_media: true },
  citation_rules: { required: false },
  tone_rules: { style: 'clear, educational, academically responsible' },
  output_format_rules: { format: 'structured JSON compatible with NOVAIS course metadata' },
  prompt_instructions: '',
  validation_schema: { required: ['title', 'description', 'chapters'] },
  form_schema: { title: 'Blueprint details', fields: [defaultField()] },
};

const authConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

const asArray = (value) => (Array.isArray(value) ? value : []);
const fieldsOf = (form) => asArray(form.form_schema?.fields);
const isArabic = () => document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl';
const label = (en, ar) => (isArabic() ? ar : en);

const normalizeBlueprint = (blueprint) => ({
  ...emptyBlueprint,
  ...blueprint,
  output_structure: blueprint.output_structure || emptyBlueprint.output_structure,
  required_sections: asArray(blueprint.required_sections).length ? blueprint.required_sections : emptyBlueprint.required_sections,
  optional_sections: asArray(blueprint.optional_sections),
  assessment_rules: blueprint.assessment_rules || emptyBlueprint.assessment_rules,
  media_rules: blueprint.media_rules || emptyBlueprint.media_rules,
  citation_rules: blueprint.citation_rules || emptyBlueprint.citation_rules,
  tone_rules: blueprint.tone_rules || emptyBlueprint.tone_rules,
  output_format_rules: blueprint.output_format_rules || emptyBlueprint.output_format_rules,
  validation_schema: blueprint.validation_schema || emptyBlueprint.validation_schema,
  form_schema: {
    title: blueprint.form_schema?.title || blueprint.name || 'Blueprint details',
    fields: fieldsOf(blueprint).length ? fieldsOf(blueprint) : fieldsOf(emptyBlueprint),
  },
});

const ChipList = ({ title, items, onChange, placeholder }) => {
  const [draft, setDraft] = useState('');
  const add = () => {
    const value = draft.trim();
    if (!value) return;
    onChange([...items, value]);
    setDraft('');
  };

  return (
    <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50/70 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="text-[11px] font-black uppercase tracking-widest text-gray-400">{title}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span key={`${item}-${index}`} className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
            {item}
            <button type="button" onClick={() => onChange(items.filter((_, i) => i !== index))} className="text-blue-500 hover:text-red-500">
              <LuTrash2 size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-gray-950 dark:text-white"
        />
        <button type="button" onClick={add} className="rounded-lg bg-blue-600 px-3 text-white">
          <LuPlus size={16} />
        </button>
      </div>
    </div>
  );
};

const Toggle = ({ checked, onChange, children }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-start text-sm font-bold transition ${
      checked
        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200'
        : 'border-gray-200 bg-white text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300'
    }`}
  >
    <span>{children}</span>
    {checked ? <LuToggleRight size={22} /> : <LuToggleLeft size={22} />}
  </button>
);

const FieldEditor = ({ fields, onChange }) => {
  const update = (index, patch) => onChange(fields.map((field, i) => (i === index ? { ...field, ...patch } : field)));
  const updateLabel = (index, lang, value) => {
    const field = fields[index];
    update(index, { label: { ...(field.label || {}), [lang]: value } });
  };

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white">{label('Dynamic create form', 'نموذج الإنشاء الديناميكي')}</h3>
          <p className="mt-1 text-xs text-gray-500">{label('These fields appear on web and mobile for the selected blueprint.', 'هذه الحقول تظهر في الويب والموبايل حسب نوع المحتوى.')}</p>
        </div>
        <button type="button" onClick={() => onChange([...fields, defaultField()])} className="rounded-lg bg-blue-600 p-2 text-white">
          <LuPlus size={16} />
        </button>
      </div>
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={`${field.key}-${index}`} className="rounded-lg border border-gray-100 bg-white p-3 dark:border-white/10 dark:bg-white/5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_140px_110px_auto]">
              <input value={field.key || ''} onChange={(e) => update(index, { key: e.target.value })} placeholder="field_key" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-gray-950 dark:text-white" />
              <select value={field.type || 'text'} onChange={(e) => update(index, { type: e.target.value })} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-gray-950 dark:text-white">
                {['text', 'textarea', 'number', 'select', 'multiselect', 'boolean'].map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <Toggle checked={!!field.required} onChange={(value) => update(index, { required: value })}>{label('Required', 'إجباري')}</Toggle>
              <button type="button" onClick={() => onChange(fields.filter((_, i) => i !== index))} className="rounded-lg border border-red-100 px-3 text-red-500 hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10">
                <LuTrash2 size={16} />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <input value={field.label?.en || ''} onChange={(e) => updateLabel(index, 'en', e.target.value)} placeholder="English label" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-gray-950 dark:text-white" />
              <input value={field.label?.ar || ''} onChange={(e) => updateLabel(index, 'ar', e.target.value)} placeholder="Arabic label" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-gray-950 dark:text-white" />
              <input value={field.placeholder || ''} onChange={(e) => update(index, { placeholder: e.target.value })} placeholder="Placeholder" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-gray-950 dark:text-white" />
            </div>
            {['select', 'multiselect'].includes(field.type) && (
              <ChipList
                title={label('Options', 'الاختيارات')}
                items={asArray(field.options)}
                onChange={(options) => update(index, { options })}
                placeholder="Add option"
              />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

const ContentBlueprints = () => {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [advanced, setAdvanced] = useState(false);

  const form = useMemo(() => normalizeBlueprint(selected || emptyBlueprint), [selected]);

  const load = async () => {
    const res = await axios.get(`${serverURL}/admin/content-blueprints`, authConfig());
    const next = (res.data || []).map(normalizeBlueprint);
    setItems(next);
    setSelected((current) => current || next[0] || emptyBlueprint);
  };

  useEffect(() => {
    load().catch(() => toast.error('Failed to load content blueprints'));
  }, []);

  const updateField = (key, value) => setSelected((current) => normalizeBlueprint({ ...(current || emptyBlueprint), [key]: value }));
  const updateRule = (group, key, value) => updateField(group, { ...(form[group] || {}), [key]: value });

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        output_structure: { ...(form.output_structure || {}), sections: form.required_sections },
      };
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

  const duplicate = () => setSelected(normalizeBlueprint({
    ...form,
    id: undefined,
    name: `${form.name} Copy`,
    slug: `${form.slug}-copy`,
    sort_order: (Number(form.sort_order) || 0) + 1,
  }));

  return (
    <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-1 sm:px-4 lg:grid-cols-[300px_1fr]">
      <Card className="p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-black text-gray-900 dark:text-white">{label('AI Blueprints', 'مخططات الذكاء الاصطناعي')}</h2>
          <button type="button" onClick={() => setSelected(emptyBlueprint)} className="rounded-lg bg-blue-600 p-2 text-white" title="Create blueprint">
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
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">{label('Name', 'الاسم')}</span>
              <input value={form.name} onChange={(e) => updateField('name', e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" />
            </label>
            <label className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Slug</span>
              <input value={form.slug} onChange={(e) => updateField('slug', e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" />
            </label>
            <label className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">{label('Academic level', 'المستوى الأكاديمي')}</span>
              <input value={form.target_academic_level || ''} onChange={(e) => updateField('target_academic_level', e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" />
            </label>
            <label className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">{label('Default count', 'العدد الافتراضي')}</span>
              <input type="number" min="1" value={form.default_count || 5} onChange={(e) => updateField('default_count', Number(e.target.value))} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" />
            </label>
          </div>

          <label className="mt-4 block space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">{label('Prompt instructions', 'تعليمات التوليد')}</span>
            <textarea value={form.prompt_instructions || ''} onChange={(e) => updateField('prompt_instructions', e.target.value)} className="min-h-[110px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" />
          </label>
        </Card>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChipList title={label('Required sections', 'الأقسام المطلوبة')} items={asArray(form.required_sections)} onChange={(items) => updateField('required_sections', items)} placeholder="overview, chapters..." />
          <ChipList title={label('Optional sections', 'الأقسام الاختيارية')} items={asArray(form.optional_sections)} onChange={(items) => updateField('optional_sections', items)} placeholder="media suggestions..." />
        </div>

        <Card className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
          <Toggle checked={!!form.assessment_rules?.include_quiz} onChange={(value) => updateRule('assessment_rules', 'include_quiz', value)}>{label('Include quizzes', 'تضمين اختبارات')}</Toggle>
          <Toggle checked={!!form.media_rules?.prefer_instructional_media} onChange={(value) => updateRule('media_rules', 'prefer_instructional_media', value)}>{label('Prefer instructional media', 'تفضيل وسائط تعليمية')}</Toggle>
          <Toggle checked={!!form.media_rules?.avoid_decorative_media} onChange={(value) => updateRule('media_rules', 'avoid_decorative_media', value)}>{label('Avoid decorative media', 'تجنب الوسائط الزخرفية')}</Toggle>
          <Toggle checked={!!form.citation_rules?.required} onChange={(value) => updateRule('citation_rules', 'required', value)}>{label('Require citations', 'إلزام المراجع')}</Toggle>
          <label className="space-y-2 md:col-span-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">{label('Tone', 'النبرة')}</span>
            <input value={form.tone_rules?.style || ''} onChange={(e) => updateRule('tone_rules', 'style', e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" />
          </label>
        </Card>

        <FieldEditor fields={fieldsOf(form)} onChange={(fields) => updateField('form_schema', { ...(form.form_schema || {}), fields })} />

        {advanced && (
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-gray-900 dark:text-white">
              <LuSettings2 size={16} /> {label('Advanced developer JSON', 'JSON للمطورين')}
            </div>
            <pre className="max-h-[360px] overflow-auto rounded-lg bg-gray-950 p-4 text-xs text-gray-100">
              {JSON.stringify({
                output_structure: { ...(form.output_structure || {}), sections: form.required_sections },
                validation_schema: form.validation_schema,
                form_schema: form.form_schema,
              }, null, 2)}
            </pre>
          </Card>
        )}

        {preview && (
          <Card className="p-4">
            <pre className="max-h-[340px] overflow-auto whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-200">
              {JSON.stringify({
                blueprint: form.slug,
                required_sections: form.required_sections,
                dynamic_fields: fieldsOf(form).map((field) => field.key),
              }, null, 2)}
            </pre>
          </Card>
        )}

        <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-gray-100 bg-white/90 py-3 backdrop-blur dark:border-white/10 dark:bg-gray-950/90">
          <Button onClick={() => updateField('enabled', !form.enabled)} variant="secondary" className="gap-2">
            {form.enabled ? <LuToggleRight size={18} /> : <LuToggleLeft size={18} />}
            {form.enabled ? label('Enabled', 'مفعل') : label('Disabled', 'معطل')}
          </Button>
          <Button onClick={duplicate} variant="secondary" className="gap-2"><LuCopy size={18} /> {label('Duplicate', 'نسخ')}</Button>
          <Button onClick={() => setAdvanced((value) => !value)} variant="secondary" className="gap-2">{advanced ? <LuEyeOff size={18} /> : <LuSettings2 size={18} />} {label('Advanced', 'متقدم')}</Button>
          <Button onClick={() => setPreview((value) => !value)} variant="secondary" className="gap-2"><LuEye size={18} /> {label('Preview', 'معاينة')}</Button>
          <Button onClick={save} disabled={saving} className="gap-2"><LuSave size={18} /> {saving ? label('Saving...', 'جار الحفظ...') : label('Save', 'حفظ')}</Button>
        </div>
      </div>
    </div>
  );
};

export default ContentBlueprints;

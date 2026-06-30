import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import {
  LuCopy,
  LuEye,
  LuPlus,
  LuSave,
  LuSettings2,
  LuToggleLeft,
  LuToggleRight,
  LuTrash2,
  LuSparkles
} from 'react-icons/lu';
import { serverURL } from '../constants';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const defaultField = () => ({
  key: `field_${Date.now()}`,
  type: 'text',
  label: { en: 'New field', ar: 'حقل جديد' },
  required: false,
  placeholder: { en: '', ar: '' },
  options: [],
});

const emptyBlueprint = {
  name: { en: '', ar: '' },
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

const normalizeBilingual = (val, defaultVal = '') => {
  if (!val) return { en: defaultVal, ar: defaultVal };
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (parsed && (parsed.en || parsed.ar)) return { en: parsed.en || '', ar: parsed.ar || '' };
    } catch(e) {}
    return { en: val, ar: val };
  }
  if (typeof val === 'object') {
    return { en: val.en || '', ar: val.ar || '' };
  }
  return { en: defaultVal, ar: defaultVal };
};

const normalizeBlueprint = (blueprint) => {
  const normalizedFields = fieldsOf(blueprint).map(field => ({
    ...defaultField(),
    ...field,
    label: normalizeBilingual(field.label, 'New field'),
    placeholder: normalizeBilingual(field.placeholder),
    options: asArray(field.options).map(opt => {
      if (typeof opt === 'string') {
        return { label: { en: opt, ar: opt }, value: opt.toLowerCase().replace(/\s+/g, '-') };
      }
      return {
        label: normalizeBilingual(opt?.label),
        value: opt?.value || ''
      };
    })
  }));

  return {
    ...emptyBlueprint,
    ...blueprint,
    name: normalizeBilingual(blueprint?.name),
    output_structure: blueprint?.output_structure || emptyBlueprint.output_structure,
    required_sections: asArray(blueprint?.required_sections).length ? blueprint.required_sections : emptyBlueprint.required_sections,
    optional_sections: asArray(blueprint?.optional_sections),
    assessment_rules: blueprint?.assessment_rules || emptyBlueprint.assessment_rules,
    media_rules: blueprint?.media_rules || emptyBlueprint.media_rules,
    citation_rules: blueprint?.citation_rules || emptyBlueprint.citation_rules,
    tone_rules: blueprint?.tone_rules || emptyBlueprint.tone_rules,
    output_format_rules: blueprint?.output_format_rules || emptyBlueprint.output_format_rules,
    validation_schema: blueprint?.validation_schema || emptyBlueprint.validation_schema,
    form_schema: {
      title: blueprint?.form_schema?.title || (blueprint?.name ? (typeof blueprint.name === 'object' ? blueprint.name.en : blueprint.name) : '') || 'Blueprint details',
      fields: normalizedFields.length ? normalizedFields : [defaultField()]
    }
  };
};

const ChipList = ({ title, items, onChange, placeholder, isRtl }) => {
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
    className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-start text-sm font-bold transition w-full ${
      checked
        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200'
        : 'border-gray-200 bg-white text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300'
    }`}
  >
    <span>{children}</span>
    {checked ? <LuToggleRight size={22} /> : <LuToggleLeft size={22} />}
  </button>
);

const OptionEditor = ({ options, onChange, labelText, addOptionText, optionEnPlaceholder, optionArPlaceholder, advanced }) => {
  const updateOption = (index, patch) => {
    onChange(options.map((opt, i) => i === index ? { ...opt, ...patch } : opt));
  };
  const addOption = () => {
    onChange([...options, { label: { en: 'New option', ar: 'خيار جديد' }, value: `option_${Date.now()}` }]);
  };
  const removeOption = (index) => {
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-gray-100 bg-gray-50/70 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">{labelText}</span>
        <button type="button" onClick={addOption} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-500">
          <LuPlus size={14} /> {addOptionText}
        </button>
      </div>
      <div className="space-y-2">
        {options.map((opt, optIndex) => (
          <div key={optIndex} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_120px_auto] items-center">
            <input
              value={opt.label?.en || ''}
              onChange={(e) => updateOption(optIndex, { label: { ...(opt.label || {}), en: e.target.value }, value: opt.value || e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              placeholder={optionEnPlaceholder}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs dark:border-white/10 dark:bg-gray-950 dark:text-white"
            />
            <input
              value={opt.label?.ar || ''}
              onChange={(e) => updateOption(optIndex, { label: { ...(opt.label || {}), ar: e.target.value } })}
              placeholder={optionArPlaceholder}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs dark:border-white/10 dark:bg-gray-950 dark:text-white"
              dir="rtl"
            />
            <input
              value={opt.value || ''}
              onChange={(e) => updateOption(optIndex, { value: e.target.value })}
              placeholder="value"
              disabled={!advanced}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs disabled:bg-gray-100 disabled:opacity-75 dark:border-white/10 dark:bg-gray-950 dark:text-white dark:disabled:bg-gray-900"
            />
            <button type="button" onClick={() => removeOption(optIndex)} className="text-red-500 hover:text-red-600 p-1">
              <LuTrash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const FieldEditor = ({ fields, onChange, advanced, t, label }) => {
  const update = (index, patch) => onChange(fields.map((field, i) => (i === index ? { ...field, ...patch } : field)));
  
  const updateLabel = (index, lang, value) => {
    const field = fields[index];
    update(index, { label: { ...(field.label || {}), [lang]: value } });
  };

  const updatePlaceholder = (index, lang, value) => {
    const field = fields[index];
    const ph = typeof field.placeholder === 'object' ? field.placeholder : { en: field.placeholder || '', ar: field.placeholder || '' };
    update(index, { placeholder: { ...ph, [lang]: value } });
  };

  return (
    <Card className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white">{label('Dynamic create form fields', 'حقول نموذج الإنشاء الديناميكي')}</h3>
          <p className="mt-1 text-xs text-gray-500">{label('These fields appear to learners on the generation screens.', 'هذه الحقول تظهر للمستخدمين لتخصيص محتواهم.')}</p>
        </div>
        <button type="button" onClick={() => onChange([...fields, defaultField()])} className="rounded-lg bg-blue-600 p-2 text-white">
          <LuPlus size={16} />
        </button>
      </div>
      <div className="space-y-4">
        {fields.map((field, index) => {
          const ph = typeof field.placeholder === 'object' ? field.placeholder : { en: field.placeholder || '', ar: field.placeholder || '' };
          return (
            <div key={`${field.key}-${index}`} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5 space-y-3">
              {advanced ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_140px_130px_auto] items-center">
                  <label className="block space-y-1">
                    <span className="text-[10px] font-bold text-gray-400">{t('admin.field_key')}</span>
                    <input value={field.key || ''} onChange={(e) => update(index, { key: e.target.value })} placeholder="field_key" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-gray-950 dark:text-white" />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[10px] font-bold text-gray-400">{t('admin.field_type')}</span>
                    <select value={field.type || 'text'} onChange={(e) => update(index, { type: e.target.value })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-gray-950 dark:text-white">
                      {['text', 'textarea', 'number', 'select', 'multiselect', 'boolean'].map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </label>
                  <div className="pt-5">
                    <Toggle checked={!!field.required} onChange={(value) => update(index, { required: value })}>{t('admin.field_required')}</Toggle>
                  </div>
                  <div className="pt-5 flex justify-end">
                    <button type="button" onClick={() => onChange(fields.filter((_, i) => i !== index))} className="rounded-lg border border-red-100 p-2 text-red-500 hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10">
                      <LuTrash2 size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    {field.label?.[t('i18n.language')?.startsWith('ar') ? 'ar' : 'en'] || field.key}
                  </span>
                  <button type="button" onClick={() => onChange(fields.filter((_, i) => i !== index))} className="text-red-500 hover:text-red-600 p-1">
                    <LuTrash2 size={16} />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-[10px] font-bold text-gray-400">{t('admin.field_label_en')}</span>
                  <input value={field.label?.en || ''} onChange={(e) => updateLabel(index, 'en', e.target.value)} placeholder="Label in English" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-gray-950 dark:text-white" />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] font-bold text-gray-400">{t('admin.field_label_ar')}</span>
                  <input value={field.label?.ar || ''} onChange={(e) => updateLabel(index, 'ar', e.target.value)} placeholder="التسمية بالعربية" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-gray-950 dark:text-white" dir="rtl" />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] font-bold text-gray-400">{t('admin.field_placeholder_en')}</span>
                  <input value={ph.en || ''} onChange={(e) => updatePlaceholder(index, 'en', e.target.value)} placeholder="Placeholder in English" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-gray-950 dark:text-white" />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] font-bold text-gray-400">{t('admin.field_placeholder_ar')}</span>
                  <input value={ph.ar || ''} onChange={(e) => updatePlaceholder(index, 'ar', e.target.value)} placeholder="النص المساعد بالعربية" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-gray-950 dark:text-white" dir="rtl" />
                </label>
              </div>

              {['select', 'multiselect'].includes(field.type) && (
                <OptionEditor
                  labelText={t('admin.field_options')}
                  addOptionText={t('admin.add_option')}
                  optionEnPlaceholder={t('admin.option_label_en')}
                  optionArPlaceholder={t('admin.option_label_ar')}
                  options={asArray(field.options)}
                  onChange={(options) => update(index, { options })}
                  advanced={advanced}
                />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const ContentBlueprints = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language.startsWith('ar');
  const label = (en, ar) => (isRtl ? ar : en);

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
    setSelected((current) => {
      if (!current) return next[0] || emptyBlueprint;
      const updatedCurrent = next.find(item => item.id === current.id);
      return updatedCurrent || next[0] || emptyBlueprint;
    });
  };

  useEffect(() => {
    load().catch(() => toast.error(label('Failed to load blueprints', 'فشل في تحميل المخططات')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      toast.success(label('Content blueprint saved', 'تم حفظ المخطط بنجاح'));
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || label('Failed to save blueprint', 'فشل حفظ المخطط'));
    } finally {
      setSaving(false);
    }
  };

  const duplicate = () => {
    const enName = form.name?.en || '';
    const arName = form.name?.ar || '';
    setSelected(normalizeBlueprint({
      ...form,
      id: undefined,
      name: { en: `${enName} Copy`, ar: `${arName} مكرر` },
      slug: `${form.slug}-copy`,
      sort_order: (Number(form.sort_order) || 0) + 1,
    }));
  };

  const nameText = (item) => {
    if (!item?.name) return '';
    return typeof item.name === 'object' ? label(item.name.en, item.name.ar) : item.name;
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-1 sm:px-4 pb-32">
      {/* Premium selector grid at the top instead of duplicate sidebar */}
      <div className="mb-8 bg-gray-50/50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <LuSparkles className="text-blue-500" />
            {t('admin.content_blueprints')}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => {
            const isSelected = form.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(item)}
                className={`flex flex-col justify-between rounded-xl border p-3 text-start transition duration-200 h-24 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/50 text-blue-700 ring-2 ring-blue-500/20 dark:bg-blue-950/20 dark:text-blue-200'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-gray-200'
                }`}
              >
                <div className="min-w-0 w-full">
                  <span className="block font-black text-xs truncate leading-snug">{nameText(item)}</span>
                  <span className="mt-1 block text-[10px] font-mono opacity-60 truncate">{item.slug}</span>
                </div>
                <span className={`self-start rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none ${item.enabled ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-white/5'}`}>
                  {item.enabled ? label('Enabled', 'مفعل') : label('Disabled', 'معطل')}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setSelected(emptyBlueprint)}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-white/10 p-3 text-gray-400 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-500 transition duration-200 h-24"
          >
            <LuPlus size={20} />
            <span className="mt-1 text-[11px] font-bold">{label('Add Blueprint', 'إضافة مخطط جديد')}</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Advanced Mode Toggle Banner */}
        <Card className="p-4 flex items-center justify-between border-blue-500/20 bg-blue-500/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <LuSettings2 size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t('admin.advanced_mode')}</h4>
              <p className="text-xs text-gray-500">{label('Show advanced developer options & AI generation prompt details.', 'عرض خيارات المطور المتقدمة وتفاصيل موجه الذكاء الاصطناعي.')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAdvanced((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${advanced ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${advanced ? (isRtl ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'}`} />
          </button>
        </Card>

        {/* Blueprint settings card */}
        <Card className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-[10px] font-bold text-gray-400">{t('admin.blueprint_name_en')}</span>
              <input value={form.name?.en || ''} onChange={(e) => updateField('name', { ...(form.name || {}), en: e.target.value })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-bold text-gray-400">{t('admin.blueprint_name_ar')}</span>
              <input value={form.name?.ar || ''} onChange={(e) => updateField('name', { ...(form.name || {}), ar: e.target.value })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" dir="rtl" />
            </label>
            {advanced && (
              <>
                <label className="block space-y-1">
                  <span className="text-[10px] font-bold text-gray-400">{t('admin.blueprint_slug')}</span>
                  <input value={form.slug} onChange={(e) => updateField('slug', e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] font-bold text-gray-400">{t('admin.platform_config.enabled_levels')}</span>
                  <input value={form.target_academic_level || ''} onChange={(e) => updateField('target_academic_level', e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] font-bold text-gray-400">{t('admin.plan_mgmt.limit_label')}</span>
                  <input type="number" min="1" value={form.default_count || 5} onChange={(e) => updateField('default_count', Number(e.target.value))} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" />
                </label>
              </>
            )}
          </div>

          {advanced && (
            <label className="block space-y-1 pt-2">
              <span className="text-[10px] font-bold text-gray-400">{t('admin.blueprint_form_schema')}</span>
              <textarea value={form.prompt_instructions || ''} onChange={(e) => updateField('prompt_instructions', e.target.value)} className="min-h-[120px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" />
            </label>
          )}
        </Card>

        {advanced && (
          <>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <ChipList title={label('Required sections', 'الأقسام المطلوبة')} items={asArray(form.required_sections)} onChange={(items) => updateField('required_sections', items)} placeholder="overview, chapters..." isRtl={isRtl} />
              <ChipList title={label('Optional sections', 'الأقسام الاختيارية')} items={asArray(form.optional_sections)} onChange={(items) => updateField('optional_sections', items)} placeholder="media suggestions..." isRtl={isRtl} />
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
          </>
        )}

        <FieldEditor fields={fieldsOf(form)} onChange={(fields) => updateField('form_schema', { ...(form.form_schema || {}), fields })} advanced={advanced} t={t} label={label} />

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

        {/* Bottom actions sticky bar */}
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 dark:border-white/5 bg-white/95 dark:bg-[#02040a]/95 py-4 px-4 sm:px-6 shadow-2xl backdrop-blur">
          <div className="mx-auto max-w-7xl flex flex-wrap justify-end gap-2">
            <Button onClick={() => updateField('enabled', !form.enabled)} variant="secondary" className="gap-2">
              {form.enabled ? <LuToggleRight size={18} /> : <LuToggleLeft size={18} />}
              {form.enabled ? label('Enabled', 'مفعل') : label('Disabled', 'معطل')}
            </Button>
            {advanced && (
              <Button onClick={duplicate} variant="secondary" className="gap-2">
                <LuCopy size={18} /> {label('Duplicate', 'نسخ')}
              </Button>
            )}
            <Button onClick={() => setPreview((value) => !value)} variant="secondary" className="gap-2">
              <LuEye size={18} /> {label('Preview', 'معاينة')}
            </Button>
            <Button onClick={save} disabled={saving} className="gap-2">
              <LuSave size={18} /> {saving ? label('Saving...', 'جار الحفظ...') : label('Save', 'حفظ')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentBlueprints;

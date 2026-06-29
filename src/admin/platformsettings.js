import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { serverURL } from '../constants';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { 
  LuSettings, 
  LuLanguages, 
  LuRocket, 
  LuImage, 
  LuMonitor
} from 'react-icons/lu';

// Predefined option lists for smooth UX
const predefinedLanguages = [
  'English', 'Arabic', 'French', 'Spanish', 'German', 'Italian', 
  'Portuguese', 'Russian', 'Japanese', 'Chinese', 'Hindi', 
  'Korean', 'Turkish', 'Polish', 'Dutch', 'Indonesian', 'Thai', 
  'Swedish', 'Greek', 'Czech', 'Romanian', 'Hungarian', 'Ukrainian'
];

const predefinedCourseTypes = [
  'Theory & Image Course', 
  'Video & Theory Course'
];

const predefinedLevels = [
  'Beginner', 'Intermediate', 'Advanced', 'Professional'
];

const predefinedDepths = [5, 10, 15, 20, 25];

const PlatformSettings = () => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'languages' | 'complexity' | 'web' | 'mobile'
  
  const [form, setForm] = useState({
    course_creation_enabled: true,
    all_languages_free: false,
    video_courses_enabled: true,
    video_courses_free: false,
    enabled_languages: [],
    free_languages: [],
    enabled_course_types: [],
    free_course_types: [],
    enabled_levels: [],
    free_levels: [],
    enabled_depths: [],
    free_depth_limit: 5,
    hero_media_type: 'image',
    hero_media_url: '',
    web_hero_title_en: '',
    web_hero_title_ar: '',
    web_hero_subtitle_en: '',
    web_hero_subtitle_ar: '',
    web_hero_badge_en: '',
    web_hero_badge_ar: '',
    web_hero_cta_en: '',
    web_hero_cta_ar: '',
    download_page_title_en: '',
    download_page_title_ar: '',
    download_page_desc_en: '',
    download_page_desc_ar: '',
    windows_download_url: '',
    mobile_download_url: '',
    system_theme_mode: 'user_choice',
    hero_media_muted: true,
    hero_media_loop: true,
    hero_media_poster: '',
  });

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${serverURL}/admin/platform-config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setForm({
        course_creation_enabled: !!res.data.course_creation_enabled,
        all_languages_free: !!res.data.all_languages_free,
        video_courses_enabled: !!res.data.video_courses_enabled,
        video_courses_free: !!res.data.video_courses_free,
        enabled_languages: Array.isArray(res.data.enabled_languages) ? res.data.enabled_languages : [],
        free_languages: Array.isArray(res.data.free_languages) ? res.data.free_languages : [],
        enabled_course_types: Array.isArray(res.data.enabled_course_types) ? res.data.enabled_course_types : [],
        free_course_types: Array.isArray(res.data.free_course_types) ? res.data.free_course_types : [],
        enabled_levels: Array.isArray(res.data.enabled_levels) ? res.data.enabled_levels : [],
        free_levels: Array.isArray(res.data.free_levels) ? res.data.free_levels : [],
        enabled_depths: Array.isArray(res.data.enabled_depths) ? res.data.enabled_depths.map(Number) : [],
        free_depth_limit: res.data.free_depth_limit !== undefined ? Number(res.data.free_depth_limit) : 5,
        hero_media_type: res.data.hero_media_type || 'image',
        hero_media_url: res.data.hero_media_url || '',
        web_hero_title_en: res.data.web_hero_title_en || '',
        web_hero_title_ar: res.data.web_hero_title_ar || '',
        web_hero_subtitle_en: res.data.web_hero_subtitle_en || '',
        web_hero_subtitle_ar: res.data.web_hero_subtitle_ar || '',
        web_hero_badge_en: res.data.web_hero_badge_en || '',
        web_hero_badge_ar: res.data.web_hero_badge_ar || '',
        web_hero_cta_en: res.data.web_hero_cta_en || '',
        web_hero_cta_ar: res.data.web_hero_cta_ar || '',
        download_page_title_en: res.data.download_page_title_en || '',
        download_page_title_ar: res.data.download_page_title_ar || '',
        download_page_desc_en: res.data.download_page_desc_en || '',
        download_page_desc_ar: res.data.download_page_desc_ar || '',
        windows_download_url: res.data.windows_download_url || '',
        mobile_download_url: res.data.mobile_download_url || '',
        system_theme_mode: res.data.system_theme_mode || 'user_choice',
        hero_media_muted: res.data.hero_media_muted !== undefined ? !!res.data.hero_media_muted : true,
        hero_media_loop: res.data.hero_media_loop !== undefined ? !!res.data.hero_media_loop : true,
        hero_media_poster: res.data.hero_media_poster || '',
      });
    } catch (error) {
      toast.error(t('admin.platform_config.load_fail') || 'Failed to load platform settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (key) => {
    setForm((current) => ({ ...current, [key]: !current[key] }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${serverURL}/admin/platform-config`, {
        course_creation_enabled: form.course_creation_enabled,
        all_languages_free: form.all_languages_free,
        video_courses_enabled: form.video_courses_enabled,
        video_courses_free: form.video_courses_free,
        enabled_languages: form.enabled_languages,
        free_languages: form.free_languages,
        enabled_course_types: form.enabled_course_types,
        free_course_types: form.free_course_types,
        enabled_levels: form.enabled_levels,
        free_levels: form.free_levels,
        enabled_depths: form.enabled_depths.map(Number),
        free_depth_limit: parseInt(form.free_depth_limit, 10) || 5,
        hero_media_type: form.hero_media_type,
        hero_media_url: form.hero_media_url,
        web_hero_title_en: form.web_hero_title_en,
        web_hero_title_ar: form.web_hero_title_ar,
        web_hero_subtitle_en: form.web_hero_subtitle_en,
        web_hero_subtitle_ar: form.web_hero_subtitle_ar,
        web_hero_badge_en: form.web_hero_badge_en,
        web_hero_badge_ar: form.web_hero_badge_ar,
        web_hero_cta_en: form.web_hero_cta_en,
        web_hero_cta_ar: form.web_hero_cta_ar,
        download_page_title_en: form.download_page_title_en,
        download_page_title_ar: form.download_page_title_ar,
        download_page_desc_en: form.download_page_desc_en,
        download_page_desc_ar: form.download_page_desc_ar,
        windows_download_url: form.windows_download_url,
        mobile_download_url: form.mobile_download_url,
        system_theme_mode: form.system_theme_mode,
        hero_media_muted: form.hero_media_muted,
        hero_media_loop: form.hero_media_loop,
        hero_media_poster: form.hero_media_poster,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(t('admin.platform_config.saved_success') || 'Platform settings saved');
      fetchConfig();
    } catch (error) {
      toast.error(t('admin.platform_config.saved_fail') || 'Failed to save platform settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400 animate-pulse">{t('admin.platform_config.loading') || 'Loading platform settings...'}</div>;
  }

  const isRtl = i18n.language.startsWith('ar');

  const tabs = [
    { id: 'general', name: isRtl ? 'الإعدادات العامة' : 'General', icon: LuSettings },
    { id: 'languages', name: isRtl ? 'اللغات والأنواع' : 'Languages & Types', icon: LuLanguages },
    { id: 'complexity', name: isRtl ? 'الصعوبة والدروس' : 'Difficulty & Modules', icon: LuRocket },
    { id: 'web', name: isRtl ? 'تخصيص الويب' : 'Web Customizer', icon: LuImage },
    { id: 'mobile', name: isRtl ? 'تطبيق الموبايل والكمبيوتر' : 'Mobile & Desktop App', icon: LuMonitor },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 px-2 sm:px-4 md:px-6">
      
      {/* Dynamic Tab Bar: Scrollable on extremely small devices */}
      <div className="flex border-b border-gray-200 dark:border-white/10 overflow-x-auto scrollbar-none whitespace-nowrap gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer select-none
                ${isActive 
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-extrabold' 
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <Icon size={16} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        
        {/* TAB 1: General Options */}
        {activeTab === 'general' && (
          <div className="space-y-6 animate-in fade-in duration-250">
            <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                {isRtl ? 'مفاتيح التشغيل الأساسية' : 'Core Switches'}
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                {[
                  {
                    key: 'course_creation_enabled',
                    title: t('admin.platform_config.course_creation_enabled') || 'Course creation enabled',
                    desc: isRtl ? 'السماح للمستخدمين بإنشاء دورات جديدة' : 'Allow users to generate new AI courses'
                  },
                  {
                    key: 'all_languages_free',
                    title: t('admin.platform_config.all_languages_free') || 'All languages free',
                    desc: isRtl ? 'إلغاء قيود الاشتراك المدفوع عن جميع اللغات' : 'Make all translation languages available for free plans'
                  },
                  {
                    key: 'video_courses_enabled',
                    title: t('admin.platform_config.video_courses_enabled') || 'Video courses enabled',
                    desc: isRtl ? 'تفعيل توليد كورسات الفيديو بالذكاء الاصطناعي' : 'Allow generation of video-based curriculums'
                  },
                  {
                    key: 'video_courses_free',
                    title: t('admin.platform_config.video_courses_free') || 'Video courses free',
                    desc: isRtl ? 'إتاحة توليد كورسات الفيديو للحسابات المجانية' : 'Allow free members to generate video courses'
                  }
                ].map((item) => (
                  <div 
                    key={item.key} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 gap-3"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                    
                    {/* Switch Toggle */}
                    <button
                      type="button"
                      onClick={() => toggle(item.key)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none 
                        ${form[item.key] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                          ${form[item.key] ? (isRtl ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'}`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            {/* System Theme Mode selector */}
            <Card className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                  {isRtl ? 'مظهر النظام الافتراضي' : 'System Theme Mode'}
                </label>
                <p className="text-xs text-gray-400 mb-3">
                  {isRtl 
                    ? 'اختر مظهر المنصة؛ إجبار اللون الفاتح فقط، الداكن فقط، التلقائي حسب الجهاز، أو حرية اختيار العضو.' 
                    : 'Choose the overall platform theme; force Light Mode only, Dark Mode only, match system OS, or let user decide.'}
                </p>
                <select
                  value={form.system_theme_mode}
                  onChange={(e) => setForm({ ...form, system_theme_mode: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white cursor-pointer shadow-sm"
                >
                  <option value="user_choice">{isRtl ? 'حرية اختيار العضو (الافتراضي)' : 'User Choice (Default)'}</option>
                  <option value="system_default">{isRtl ? 'تلقائي حسب نظام الجهاز' : 'System Default (OS)'}</option>
                  <option value="light_only">{isRtl ? 'المظهر الفاتح فقط (إجباري)' : 'Force Light Mode Only'}</option>
                  <option value="dark_only">{isRtl ? 'المظهر الداكن فقط (إجباري)' : 'Force Dark Mode Only'}</option>
                </select>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                  {t('admin.platform_config.free_depth_limit') || "Free depth limit (max lessons)"}
                </label>
                <p className="text-xs text-gray-400 mb-3">
                  {isRtl ? 'أقصى عدد من الفصول/الدروس المجانية المسموح بتوليدها قبل قفل الميزة كعضوية برو' : 'Maximum chapters/lessons allowed for free accounts before requiring a subscription limit'}
                </p>
                <input
                  type="number"
                  value={form.free_depth_limit}
                  onChange={(event) => setForm({ ...form, free_depth_limit: Number(event.target.value) })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: Languages and Formats */}
        {activeTab === 'languages' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-250">
            <TagSelector
              label={t('admin.platform_config.enabled_languages') || "Enabled languages"}
              items={form.enabled_languages}
              predefinedOptions={predefinedLanguages}
              onChange={(newVal) => {
                const filteredFree = form.free_languages.filter(l => newVal.includes(l));
                setForm({ ...form, enabled_languages: newVal, free_languages: filteredFree });
              }}
              placeholderSelect={isRtl ? "اختر لغة لإضافتها..." : "Select language to add..."}
            />

            <TagSelector
              label={t('admin.platform_config.free_languages') || "Free languages"}
              items={form.free_languages}
              predefinedOptions={form.enabled_languages}
              onChange={(newVal) => setForm({ ...form, free_languages: newVal })}
              placeholderSelect={isRtl ? "اختر لغة مجانية..." : "Select free language..."}
            />

            <TagSelector
              label={t('admin.platform_config.enabled_course_types') || "Enabled course types"}
              items={form.enabled_course_types}
              predefinedOptions={predefinedCourseTypes}
              onChange={(newVal) => {
                const filteredFree = form.free_course_types.filter(t_type => newVal.includes(t_type));
                setForm({ ...form, enabled_course_types: newVal, free_course_types: filteredFree });
              }}
              placeholderSelect={isRtl ? "اختر نوع كورس لإضافته..." : "Select course type to add..."}
            />

            <TagSelector
              label={t('admin.platform_config.free_course_types') || "Free course types"}
              items={form.free_course_types}
              predefinedOptions={form.enabled_course_types}
              onChange={(newVal) => setForm({ ...form, free_course_types: newVal })}
              placeholderSelect={isRtl ? "اختر نوع كورس مجاني..." : "Select free course type..."}
            />
          </div>
        )}

        {/* TAB 3: Levels and Depths */}
        {activeTab === 'complexity' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-250">
            <TagSelector
              label={t('admin.platform_config.enabled_levels') || "Enabled complexity levels"}
              items={form.enabled_levels}
              predefinedOptions={predefinedLevels}
              onChange={(newVal) => {
                const filteredFree = form.free_levels.filter(lvl => newVal.includes(lvl));
                setForm({ ...form, enabled_levels: newVal, free_levels: filteredFree });
              }}
              placeholderSelect={isRtl ? "اختر مستوى لإضافته..." : "Select complexity level to add..."}
            />

            <TagSelector
              label={t('admin.platform_config.free_levels') || "Free complexity levels"}
              items={form.free_levels}
              predefinedOptions={form.enabled_levels}
              onChange={(newVal) => setForm({ ...form, free_levels: newVal })}
              placeholderSelect={isRtl ? "اختر مستوى مجاني..." : "Select free complexity level..."}
            />

            <TagSelector
              label={t('admin.platform_config.enabled_depths') || "Enabled depths (number of lessons)"}
              items={form.enabled_depths}
              predefinedOptions={predefinedDepths}
              onChange={(newVal) => setForm({ ...form, enabled_depths: newVal })}
              placeholderSelect={isRtl ? "اختر عمق الكورس لإضافته..." : "Select depth to add..."}
            />
          </div>
        )}

        {/* TAB 4: Web Customizer */}
        {activeTab === 'web' && (
          <div className="space-y-6 animate-in fade-in duration-250">
            {/* Dynamic Text customization */}
            <Card className="p-4 sm:p-6 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                {isRtl ? 'تعديل نصوص الصفحة الرئيسية للويب' : 'Landing Page Copywriter'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Hero Title (English)</label>
                  <input
                    type="text"
                    value={form.web_hero_title_en}
                    onChange={(e) => setForm({ ...form, web_hero_title_en: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">العنوان الرئيسي (العربية)</label>
                  <input
                    type="text"
                    value={form.web_hero_title_ar}
                    onChange={(e) => setForm({ ...form, web_hero_title_ar: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    dir="rtl"
                  />
                </div>

                {/* Subtitle */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Hero Subtitle (English)</label>
                  <textarea
                    value={form.web_hero_subtitle_en}
                    onChange={(e) => setForm({ ...form, web_hero_subtitle_en: e.target.value })}
                    className="w-full min-h-[80px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">العنوان الفرعي (العربية)</label>
                  <textarea
                    value={form.web_hero_subtitle_ar}
                    onChange={(e) => setForm({ ...form, web_hero_subtitle_ar: e.target.value })}
                    className="w-full min-h-[80px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    dir="rtl"
                  />
                </div>

                {/* Badge */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Badge Label (English)</label>
                  <input
                    type="text"
                    value={form.web_hero_badge_en}
                    onChange={(e) => setForm({ ...form, web_hero_badge_en: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">الشارة العلوية (العربية)</label>
                  <input
                    type="text"
                    value={form.web_hero_badge_ar}
                    onChange={(e) => setForm({ ...form, web_hero_badge_ar: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    dir="rtl"
                  />
                </div>

                {/* CTA */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">CTA Button Text (English)</label>
                  <input
                    type="text"
                    value={form.web_hero_cta_en}
                    onChange={(e) => setForm({ ...form, web_hero_cta_en: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">نص زر البدء (العربية)</label>
                  <input
                    type="text"
                    value={form.web_hero_cta_ar}
                    onChange={(e) => setForm({ ...form, web_hero_cta_ar: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    dir="rtl"
                  />
                </div>

              </div>
            </Card>

            {/* Media Customizer with loop, muted, and poster configurations */}
            <HeroMediaSettings
              mediaType={form.hero_media_type}
              mediaUrl={form.hero_media_url}
              mediaMuted={form.hero_media_muted}
              mediaLoop={form.hero_media_loop}
              mediaPoster={form.hero_media_poster}
              onSaveMedia={(type, url) => setForm(prev => ({ ...prev, hero_media_type: type, hero_media_url: url }))}
              onSaveParam={(key, val) => setForm(prev => ({ ...prev, [key]: val }))}
              t={t}
              isRtl={isRtl}
            />
          </div>
        )}

        {/* TAB 5: Mobile & Desktop Installation App Customizer */}
        {activeTab === 'mobile' && (
          <div className="space-y-6 animate-in fade-in duration-250">
            <Card className="p-4 sm:p-6 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                {isRtl ? 'تعديل نصوص صفحة التثبيت والتحميل' : 'Download Page Content Customizer'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Download Title (English)</label>
                  <input
                    type="text"
                    value={form.download_page_title_en}
                    onChange={(e) => setForm({ ...form, download_page_title_en: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">عنوان صفحة التحميل (العربية)</label>
                  <input
                    type="text"
                    value={form.download_page_title_ar}
                    onChange={(e) => setForm({ ...form, download_page_title_ar: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    dir="rtl"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Download Description (English)</label>
                  <textarea
                    value={form.download_page_desc_en}
                    onChange={(e) => setForm({ ...form, download_page_desc_en: e.target.value })}
                    className="w-full min-h-[80px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">وصف صفحة التحميل (العربية)</label>
                  <textarea
                    value={form.download_page_desc_ar}
                    onChange={(e) => setForm({ ...form, download_page_desc_ar: e.target.value })}
                    className="w-full min-h-[80px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    dir="rtl"
                  />
                </div>

              </div>
            </Card>

            {/* Binary Installers uploaders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Windows .exe installer */}
              <BinaryFileUploader
                label={isRtl ? 'تطبيق الويندوز (Windows Client .exe)' : 'Windows Client Application (.exe)'}
                accept=".exe"
                fileUrl={form.windows_download_url}
                onUploadSuccess={(url) => setForm({ ...form, windows_download_url: url })}
                t={t}
              />

              {/* Mobile .apk bundle */}
              <BinaryFileUploader
                label={isRtl ? 'تطبيق الموبايل للأندرويد (Android Client .apk)' : 'Android Mobile Application (.apk)'}
                accept=".apk"
                fileUrl={form.mobile_download_url}
                onUploadSuccess={(url) => setForm({ ...form, mobile_download_url: url })}
                t={t}
              />

            </div>
          </div>
        )}
      </div>

      {/* Responsive Floating Save Bar */}
      <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-white/5">
        <Button onClick={save} disabled={saving} className="w-full sm:w-auto px-8 py-3 font-bold text-sm shadow-xl shadow-blue-500/10">
          {saving ? (t('admin.platform_config.saving') || 'Saving...') : (t('admin.platform_config.save_btn') || 'Save platform settings')}
        </Button>
      </div>
    </div>
  );
};

// TagSelector Component
const TagSelector = ({ label, items, predefinedOptions, onChange, placeholderSelect }) => {
  const currentItems = Array.isArray(items) ? items : [];
  const availableOptions = predefinedOptions.filter(opt => !currentItems.includes(opt));

  const addTag = (opt) => {
    const parsedOpt = typeof predefinedOptions[0] === 'number' ? Number(opt) : opt;
    if (parsedOpt !== undefined && parsedOpt !== "" && !currentItems.includes(parsedOpt)) {
      onChange([...currentItems, parsedOpt]);
    }
  };

  const removeTag = (opt) => {
    onChange(currentItems.filter(item => item !== opt));
  };

  return (
    <Card className="p-4 sm:p-5 flex flex-col justify-between h-full min-h-[160px]">
      <div>
        <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">{label}</label>
        
        {/* Badges list */}
        <div className="flex flex-wrap gap-1.5 mb-3 min-h-[44px] p-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 items-center">
          {currentItems.length > 0 ? (
            currentItems.map((item, idx) => (
              <span
                key={idx}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-500/15"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeTag(item)}
                  className="hover:text-red-500 dark:hover:text-red-400 font-extrabold transition-colors ml-1 cursor-pointer"
                >
                  ×
                </button>
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400 italic px-2">No items configured</span>
          )}
        </div>
      </div>

      {availableOptions.length > 0 && (
        <div className="relative mt-2">
          <select
            value=""
            onChange={(e) => {
              addTag(e.target.value);
              e.target.value = "";
            }}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 cursor-pointer"
          >
            <option value="" disabled>{placeholderSelect || "Select to add..."}</option>
            {availableOptions.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}
    </Card>
  );
};

// Binary Uploader for apk and exe installer versions
const BinaryFileUploader = ({ label, accept, fileUrl, onUploadSuccess, t }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file); // API expects 'file' parameter

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${serverURL}/admin/media/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data && res.data.url) {
        onUploadSuccess(res.data.url);
        toast.success(t('admin.platform_config.media_uploaded') || 'Binary uploaded successfully');
      }
    } catch (err) {
      toast.error('Upload failed. Ensure file is within size limits.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-5 space-y-4 flex flex-col justify-between h-full">
      <div>
        <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">{label}</label>
        {fileUrl ? (
          <div className="p-3 bg-green-500/10 text-green-600 dark:text-green-300 dark:bg-green-950/20 border border-green-500/20 rounded-xl text-xs flex items-center justify-between gap-3">
            <span className="font-bold truncate break-all">{fileUrl}</span>
            <a 
              href={fileUrl.startsWith('http') ? fileUrl : `${serverURL.replace('/api', '')}${fileUrl}`} 
              download 
              className="shrink-0 text-blue-500 font-extrabold hover:underline"
            >
              Download
            </a>
          </div>
        ) : (
          <div className="p-3 bg-gray-100 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/5 text-gray-400 rounded-xl text-xs italic">
            No binary file uploaded yet
          </div>
        )}
      </div>

      <div className="flex items-center justify-center w-full mt-3">
        <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition p-2 text-center">
          <span className="text-xs text-blue-500 font-bold">
            {uploading ? 'Uploading...' : 'Upload Binary File'}
          </span>
          <input type="file" className="hidden" accept={accept} onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
    </Card>
  );
};

// HeroMediaSettings Component
const HeroMediaSettings = ({ 
  mediaType, 
  mediaUrl, 
  mediaMuted, 
  mediaLoop, 
  mediaPoster,
  onSaveMedia, 
  onSaveParam,
  t, 
  isRtl 
}) => {
  const [type, setType] = useState(mediaType || 'image');
  const [url, setUrl] = useState(mediaUrl || '');
  const [uploading, setUploading] = useState(false);
  const [method, setMethod] = useState('upload'); // 'upload' | 'url'

  useEffect(() => {
    setType(mediaType);
    setUrl(mediaUrl);
  }, [mediaType, mediaUrl]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file); // API expects 'file' parameter

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${serverURL}/admin/media/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data && res.data.url) {
        setUrl(res.data.url);
        onSaveMedia(type, res.data.url);
        toast.success(t('admin.platform_config.media_uploaded') || 'Media uploaded successfully');
      }
    } catch (err) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlChange = (newUrl) => {
    setUrl(newUrl);
    onSaveMedia(type, newUrl);
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    onSaveMedia(newType, url);
  };

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <h3 className="block text-sm font-black uppercase tracking-widest text-gray-400 mb-2">
        {t('admin.platform_config.hero_media_title') || "Landing Page Preview Media"}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Form Controls */}
        <div className="space-y-4">
          
          {/* Toggle Type (Image/Video) */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Media Format</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['image', t('admin.platform_config.image') || 'Image'],
                ['video', t('admin.platform_config.video') || 'Video'],
              ].map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleTypeChange(k)}
                  className={`py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${type === k ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' : 'border-gray-200 bg-white text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {type === 'video' && (
            <div className="space-y-3 p-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Video Options</label>
              
              {/* Muted toggle */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-600 dark:text-gray-300">Play with sound</span>
                <button
                  type="button"
                  onClick={() => onSaveParam('hero_media_muted', !mediaMuted)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none 
                    ${!mediaMuted ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                      ${!mediaMuted ? (isRtl ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'}`}
                  />
                </button>
              </div>

              {/* Loop toggle */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-600 dark:text-gray-300">Loop video infinitely</span>
                <button
                  type="button"
                  onClick={() => onSaveParam('hero_media_loop', !mediaLoop)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none 
                    ${mediaLoop ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                      ${mediaLoop ? (isRtl ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'}`}
                  />
                </button>
              </div>
            </div>
          )}

          {type === 'video' && (
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Video Poster (Placeholder Image)</label>
              {mediaPoster ? (
                <div className="p-2 bg-green-500/10 text-green-600 dark:text-green-300 dark:bg-green-950/20 border border-green-500/20 rounded-xl text-xs flex items-center justify-between gap-3">
                  <span className="font-bold truncate break-all">{mediaPoster}</span>
                  <button
                    type="button"
                    onClick={() => onSaveParam('hero_media_poster', '')}
                    className="text-red-500 font-extrabold hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition p-2 text-center">
                    <span className="text-xs text-blue-500 font-bold">Select poster image</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('file', file);
                        try {
                          const token = localStorage.getItem('token');
                          const res = await axios.post(`${serverURL}/admin/media/upload`, formData, {
                            headers: {
                              Authorization: `Bearer ${token}`,
                              'Content-Type': 'multipart/form-data',
                            },
                          });
                          if (res.data && res.data.url) {
                            onSaveParam('hero_media_poster', res.data.url);
                            toast.success('Poster uploaded successfully');
                          }
                        } catch (err) {
                          toast.error('Failed to upload poster image');
                        }
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Toggle Method (Upload/URL) */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Source Method</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['upload', t('admin.platform_config.upload_file') || 'Upload File'],
                ['url', t('admin.platform_config.web_link') || 'Web Link (URL)'],
              ].map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${method === m ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' : 'border-gray-200 bg-white text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {method === 'upload' ? (
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">File Uploader</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition p-3 text-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-bold break-all">
                    Click to select {type} file
                  </span>
                  <input type="file" className="hidden" accept={type === 'video' ? 'video/*' : 'image/*'} onChange={handleFileUpload} />
                </label>
              </div>
              {uploading && <div className="text-center text-xs text-blue-500 animate-pulse">Uploading file...</div>}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Web Link (URL)</label>
              <input
                type="text"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com/media-file"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Preview box */}
        <div className="flex flex-col justify-center">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Live Preview</label>
          <div className="border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden bg-gray-50 dark:bg-white/5 h-44 flex items-center justify-center relative">
            {url ? (
              type === 'video' ? (
                <video
                  src={url.startsWith('http') ? url : `${serverURL.replace('/api', '')}${url}`}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={url.startsWith('http') ? url : `${serverURL.replace('/api', '')}${url}`}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <span className="text-xs text-gray-400 italic">No media preview available</span>
            )}
          </div>
        </div>

      </div>
    </Card>
  );
};

export default PlatformSettings;

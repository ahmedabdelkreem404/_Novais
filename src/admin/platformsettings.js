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
  LuGlobe, 
  LuPalette, 
  LuVideo, 
  LuCreditCard, 
  LuFlag, 
  LuSearch, 
  LuDownload 
} from 'react-icons/lu';

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
  const [activeTab, setActiveTab] = useState('identity'); 
  
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
    
    // Branding & Identity
    branding_platform_name_en: 'NOVAIS',
    branding_platform_name_ar: 'نوفايس',
    branding_logo_url: '',
    branding_favicon_url: '',
    
    // Theme behavior
    theme_default_mode: 'dark',

    // Hero Video Options
    hero_video_enabled: true,
    hero_video_autoplay: true,
    hero_video_loop_mode: 'loop_forever', 
    hero_video_fallback_image: '',
    hero_video_controls_hidden: true,
    hero_video_display_target: 'both', 
    hero_video_replace_low_bandwidth: true,

    // Payment visibility
    payment_methods_visible: true,
    offline_payment_instructions_en: '',
    offline_payment_instructions_ar: '',

    // Feature Flags
    feature_pdf_export_enabled: true,
    feature_ppt_export_enabled: true,
    feature_notes_enabled: true,
    feature_quiz_enabled: true,
    feature_chat_enabled: true,
    feature_audio_courses_enabled: true,

    // SEO / Social
    seo_meta_title_en: '',
    seo_meta_title_ar: '',
    seo_meta_description_en: '',
    seo_meta_description_ar: '',
    seo_meta_keywords_en: '',
    seo_meta_keywords_ar: '',
  });

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${serverURL}/admin/platform-config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setForm((current) => ({
        ...current,
        ...res.data,
        enabled_languages: Array.isArray(res.data.enabled_languages) ? res.data.enabled_languages : [],
        free_languages: Array.isArray(res.data.free_languages) ? res.data.free_languages : [],
        enabled_course_types: Array.isArray(res.data.enabled_course_types) ? res.data.enabled_course_types : [],
        free_course_types: Array.isArray(res.data.free_course_types) ? res.data.free_course_types : [],
        enabled_levels: Array.isArray(res.data.enabled_levels) ? res.data.enabled_levels : [],
        free_levels: Array.isArray(res.data.free_levels) ? res.data.free_levels : [],
        enabled_depths: Array.isArray(res.data.enabled_depths) ? res.data.enabled_depths.map(Number) : [],
        free_depth_limit: res.data.free_depth_limit !== undefined ? Number(res.data.free_depth_limit) : 5,
      }));
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
      await axios.put(`${serverURL}/admin/platform-config`, form, {
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
    { id: 'identity', name: isRtl ? 'الهوية والشعار' : 'Identity & Logo', icon: LuGlobe },
    { id: 'theme', name: isRtl ? 'مظهر المنصة' : 'Theme Settings', icon: LuPalette },
    { id: 'hero', name: isRtl ? 'فيديو البطل والواجهة' : 'Hero Video & Media', icon: LuVideo },
    { id: 'localization', name: isRtl ? 'اللغات والمحتوى' : 'Languages & Content', icon: LuLanguages },
    { id: 'payments', name: isRtl ? 'المدفوعات والظهور' : 'Payments & Visibility', icon: LuCreditCard },
    { id: 'features', name: isRtl ? 'مفاتيح الميزات' : 'Feature Flags', icon: LuFlag },
    { id: 'seo', name: isRtl ? 'محركات البحث' : 'SEO & Socials', icon: LuSearch },
    { id: 'apps', name: isRtl ? 'تطبيقات التحميل' : 'App Downloads', icon: LuDownload },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 px-1 sm:px-4">
      
      {/* Dynamic Tab Bar */}
      <div className="flex border-b border-gray-200 dark:border-white/10 overflow-x-auto scrollbar-none whitespace-nowrap gap-1 pb-1">
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
        
        {/* Tab 1: Identity & Branding */}
        {activeTab === 'identity' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <Card className="p-4 sm:p-6 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                {isRtl ? 'اسم المنصة وهوية البراند' : 'Platform Identity'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Platform Name (English)</label>
                  <input
                    type="text"
                    value={form.branding_platform_name_en}
                    onChange={(e) => setForm({ ...form, branding_platform_name_en: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">اسم المنصة (العربية)</label>
                  <input
                    type="text"
                    value={form.branding_platform_name_ar}
                    onChange={(e) => setForm({ ...form, branding_platform_name_ar: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    dir="rtl"
                  />
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FileUploaderCard
                label={isRtl ? 'شعار المنصة (Logo)' : 'Platform Logo'}
                fileUrl={form.branding_logo_url}
                onUploadSuccess={(url) => setForm({ ...form, branding_logo_url: url })}
                accept="image/*"
                t={t}
              />
              <FileUploaderCard
                label={isRtl ? 'أيقونة المتصفح (Favicon)' : 'Browser Favicon'}
                fileUrl={form.branding_favicon_url}
                onUploadSuccess={(url) => setForm({ ...form, branding_favicon_url: url })}
                accept="image/*"
                t={t}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Theme Settings */}
        {activeTab === 'theme' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <Card className="p-4 sm:p-6 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                {isRtl ? 'إعدادات الثيم ومظهر الألوان' : 'Theme & Color Behavior'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                    {isRtl ? 'مظهر النظام الأساسي' : 'System Theme Mode'}
                  </label>
                  <select
                    value={form.system_theme_mode}
                    onChange={(e) => setForm({ ...form, system_theme_mode: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white cursor-pointer"
                  >
                    <option value="user_choice">{isRtl ? 'حرية اختيار العضو (الافتراضي)' : 'User Choice (Default)'}</option>
                    <option value="system_default">{isRtl ? 'تلقائي حسب نظام الجهاز' : 'System Default (OS)'}</option>
                    <option value="light_only">{isRtl ? 'المظهر الفاتح فقط (إجباري)' : 'Force Light Mode Only'}</option>
                    <option value="dark_only">{isRtl ? 'المظهر الداكن فقط (إجباري)' : 'Force Dark Mode Only'}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                    {isRtl ? 'المظهر الافتراضي للمنصة' : 'Default Platform Theme'}
                  </label>
                  <select
                    value={form.theme_default_mode}
                    onChange={(e) => setForm({ ...form, theme_default_mode: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white cursor-pointer"
                  >
                    <option value="dark">{isRtl ? 'داكن' : 'Dark'}</option>
                    <option value="light">{isRtl ? 'فاتح' : 'Light'}</option>
                  </select>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 3: Hero Video & Media */}
        {activeTab === 'hero' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <Card className="p-4 sm:p-6 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                {isRtl ? 'تخصيص الهيرو والواجهة التفاعلية' : 'Landing Hero Copywriter'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">العنوان الرئيسي للهيرو (العربية)</label>
                  <input
                    type="text"
                    value={form.web_hero_title_ar}
                    onChange={(e) => setForm({ ...form, web_hero_title_ar: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Hero Subtitle (English)</label>
                  <textarea
                    value={form.web_hero_subtitle_en}
                    onChange={(e) => setForm({ ...form, web_hero_subtitle_en: e.target.value })}
                    className="w-full min-h-[80px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">الوصف الفرعي للهيرو (العربية)</label>
                  <textarea
                    value={form.web_hero_subtitle_ar}
                    onChange={(e) => setForm({ ...form, web_hero_subtitle_ar: e.target.value })}
                    className="w-full min-h-[80px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Hero Badge Label (English)</label>
                  <input
                    type="text"
                    value={form.web_hero_badge_en}
                    onChange={(e) => setForm({ ...form, web_hero_badge_en: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">نص الشارة العلوية (العربية)</label>
                  <input
                    type="text"
                    value={form.web_hero_badge_ar}
                    onChange={(e) => setForm({ ...form, web_hero_badge_ar: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">CTA Button (English)</label>
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

            <Card className="p-4 sm:p-6 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                {isRtl ? 'مفاتيح وسلوك تشغيل الفيديو' : 'Video Customizer'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Media Format</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['image', 'video'].map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setForm({ ...form, hero_media_type: k })}
                          className={`py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${form.hero_media_type === k ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' : 'border-gray-200 bg-white text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300'}`}
                        >
                          {k.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hero Media URL</label>
                    <input
                      type="text"
                      value={form.hero_media_url}
                      onChange={(e) => setForm({ ...form, hero_media_url: e.target.value })}
                      placeholder="https://example.com/video.mp4"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                  </div>

                  {form.hero_media_type === 'video' && (
                    <div className="space-y-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-600 dark:text-gray-300">Autoplay Video</span>
                        <button
                          type="button"
                          onClick={() => toggle('hero_video_autoplay')}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${form.hero_video_autoplay ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${form.hero_video_autoplay ? (isRtl ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'}`} />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-600 dark:text-gray-300">Play Muted</span>
                        <button
                          type="button"
                          onClick={() => toggle('hero_media_muted')}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${form.hero_media_muted ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${form.hero_media_muted ? (isRtl ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-600 dark:text-gray-300">Hide Controls UI</span>
                        <button
                          type="button"
                          onClick={() => toggle('hero_video_controls_hidden')}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${form.hero_video_controls_hidden ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${form.hero_video_controls_hidden ? (isRtl ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-600 dark:text-gray-300">Fallback on Low Bandwidth</span>
                        <button
                          type="button"
                          onClick={() => toggle('hero_video_replace_low_bandwidth')}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${form.hero_video_replace_low_bandwidth ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${form.hero_video_replace_low_bandwidth ? (isRtl ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <span className="font-bold text-xs text-gray-600 dark:text-gray-300 block">Loop Mode</span>
                        <select
                          value={form.hero_video_loop_mode}
                          onChange={(e) => setForm({ ...form, hero_video_loop_mode: e.target.value })}
                          className="w-full text-xs rounded-lg border border-gray-200 bg-white p-2 text-gray-900 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                        >
                          <option value="loop_forever">Loop Forever</option>
                          <option value="play_once">Play Once & Stop</option>
                          <option value="play_once_then_image">Play Once, then show Fallback Image</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <span className="font-bold text-xs text-gray-600 dark:text-gray-300 block">Target Client</span>
                        <select
                          value={form.hero_video_display_target}
                          onChange={(e) => setForm({ ...form, hero_video_display_target: e.target.value })}
                          className="w-full text-xs rounded-lg border border-gray-200 bg-white p-2 text-gray-900 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                        >
                          <option value="both">Both Web & Mobile</option>
                          <option value="web_only">Web Client Only</option>
                          <option value="mobile_only">Mobile Client Only</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {form.hero_media_type === 'video' && (
                    <>
                      <FileUploaderCard
                        label="Video Poster (Loading Image)"
                        fileUrl={form.hero_media_poster}
                        onUploadSuccess={(url) => setForm({ ...form, hero_media_poster: url })}
                        accept="image/*"
                        t={t}
                      />
                      <FileUploaderCard
                        label="Video Fallback Image"
                        fileUrl={form.hero_video_fallback_image}
                        onUploadSuccess={(url) => setForm({ ...form, hero_video_fallback_image: url })}
                        accept="image/*"
                        t={t}
                      />
                    </>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 4: Languages & Content */}
        {activeTab === 'localization' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                {isRtl ? 'صلاحيات إنشاء الدروس والكورسات' : 'Course Generation Core Controls'}
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                {[
                  {
                    key: 'course_creation_enabled',
                    title: isRtl ? 'تفعيل إنشاء الكورسات' : 'Course creation enabled',
                    desc: isRtl ? 'السماح للمستخدمين بإنشاء دورات جديدة' : 'Allow users to generate new AI courses'
                  },
                  {
                    key: 'all_languages_free',
                    title: isRtl ? 'جميع اللغات مجانية' : 'All languages free',
                    desc: isRtl ? 'إلغاء قيود الاشتراك المدفوع عن جميع اللغات' : 'Make all translation languages available for free plans'
                  },
                  {
                    key: 'video_courses_enabled',
                    title: isRtl ? 'تفعيل كورسات الفيديو' : 'Video courses enabled',
                    desc: isRtl ? 'تفعيل توليد كورسات الفيديو بالذكاء الاصطناعي' : 'Allow generation of video-based curriculums'
                  },
                  {
                    key: 'video_courses_free',
                    title: isRtl ? 'كورسات الفيديو مجانية' : 'Video courses free',
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
                    <button
                      type="button"
                      onClick={() => toggle(item.key)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none 
                        ${form[item.key] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${form[item.key] ? (isRtl ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                  {t('admin.platform_config.free_depth_limit') || "Free depth limit (max lessons)"}
                </label>
                <input
                  type="number"
                  value={form.free_depth_limit}
                  onChange={(event) => setForm({ ...form, free_depth_limit: Number(event.target.value) })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>
        )}

        {/* Tab 5: Payments & Visibility */}
        {activeTab === 'payments' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <Card className="p-4 sm:p-6 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                {isRtl ? 'الاشتراكات والتشغيل التجاري' : 'Pricing & Subscription Flow'}
              </h3>
              
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 gap-3">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    {isRtl ? 'عرض خطط الأسعار والترقية' : 'Display checkout/pricing tables'}
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isRtl ? 'إظهار شاشات الترقية والدفع للعملاء' : 'Toggle pricing/upgrade options visibility across clients'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggle('payment_methods_visible')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${form.payment_methods_visible ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${form.payment_methods_visible ? (isRtl ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'}`} />
                </button>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                {isRtl ? 'تعليمات الدفع اليدوي / الأوفلاين' : 'Offline Payment instructions'}
              </h3>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Instructions (English)</label>
                  <textarea
                    value={form.offline_payment_instructions_en}
                    onChange={(e) => setForm({ ...form, offline_payment_instructions_en: e.target.value })}
                    className="w-full min-h-[100px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">تعليمات الدفع (العربية)</label>
                  <textarea
                    value={form.offline_payment_instructions_ar}
                    onChange={(e) => setForm({ ...form, offline_payment_instructions_ar: e.target.value })}
                    className="w-full min-h-[100px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    dir="rtl"
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 6: Feature Flags */}
        {activeTab === 'features' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <Card className="p-4 sm:p-6 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                {isRtl ? 'مفاتيح تفعيل وتعطيل ميزات المنصة' : 'Interactive Feature Flags'}
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                {[
                  { key: 'feature_pdf_export_enabled', title: isRtl ? 'تصدير PDF' : 'PDF Export', desc: isRtl ? 'السماح بتنزيل الكورسات كملف PDF' : 'Allow exporting curriculum to PDF files' },
                  { key: 'feature_ppt_export_enabled', title: isRtl ? 'تصدير PPT' : 'PPT Slides Export', desc: isRtl ? 'تنزيل الكورسات كشرائح PowerPoint' : 'Allow exporting curriculum to PowerPoint files' },
                  { key: 'feature_notes_enabled', title: isRtl ? 'الملاحظات الدراسية' : 'Personal Notes', desc: isRtl ? 'تمكين دفتر الملاحظات للدروس' : 'Allow taking private notes inside lesson screen' },
                  { key: 'feature_quiz_enabled', title: isRtl ? 'الاختبارات الذكية' : 'Curriculum Quizzes', desc: isRtl ? 'توليد اختبارات لتقييم فهم الدرس' : 'Allow generating interactive quizzes for modules' },
                  { key: 'feature_chat_enabled', title: isRtl ? 'المعلم الذكي (شات)' : 'AI Learning Coach Chat', desc: isRtl ? 'تمكين المحادثة الفورية مع الروبوت' : 'Allow chatting with AI bot inside course player' },
                  { key: 'feature_audio_courses_enabled', title: isRtl ? 'الكورسات الصوتية' : 'Audio Book courses', desc: isRtl ? 'توليد وسماع الكورس صوتياً' : 'Allow listening to modular generated text-to-speech courses' },
                ].map((item) => (
                  <div 
                    key={item.key} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 gap-3"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggle(item.key)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${form[item.key] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${form[item.key] ? (isRtl ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Tab 7: SEO & Socials */}
        {activeTab === 'seo' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <Card className="p-4 sm:p-6 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                {isRtl ? 'إعدادات محركات البحث والـ SEO' : 'SEO Optimization'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Meta Title (English)</label>
                  <input
                    type="text"
                    value={form.seo_meta_title_en}
                    onChange={(e) => setForm({ ...form, seo_meta_title_en: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">عنوان الميتا (العربية)</label>
                  <input
                    type="text"
                    value={form.seo_meta_title_ar}
                    onChange={(e) => setForm({ ...form, seo_meta_title_ar: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Meta Description (English)</label>
                  <textarea
                    value={form.seo_meta_description_en}
                    onChange={(e) => setForm({ ...form, seo_meta_description_en: e.target.value })}
                    className="w-full min-h-[80px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">وصف الميتا (العربية)</label>
                  <textarea
                    value={form.seo_meta_description_ar}
                    onChange={(e) => setForm({ ...form, seo_meta_description_ar: e.target.value })}
                    className="w-full min-h-[80px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Meta Keywords (English)</label>
                  <input
                    type="text"
                    value={form.seo_meta_keywords_en}
                    onChange={(e) => setForm({ ...form, seo_meta_keywords_en: e.target.value })}
                    placeholder="ai, courses, learning"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">الكلمات الدلالية للميتا (العربية)</label>
                  <input
                    type="text"
                    value={form.seo_meta_keywords_ar}
                    onChange={(e) => setForm({ ...form, seo_meta_keywords_ar: e.target.value })}
                    placeholder="تعليم, ذكاء اصطناعي, دورات"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    dir="rtl"
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 8: Apps Download */}
        {activeTab === 'apps' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <Card className="p-4 sm:p-6 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                {isRtl ? 'تعديل نصوص صفحة التثبيت والتحميل' : 'Download Page Content Customizer'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FileUploaderCard
                label={isRtl ? 'تطبيق الويندوز (Windows Client .exe)' : 'Windows Client Application (.exe)'}
                fileUrl={form.windows_download_url}
                onUploadSuccess={(url) => setForm({ ...form, windows_download_url: url })}
                accept=".exe"
                t={t}
              />
              <FileUploaderCard
                label={isRtl ? 'تطبيق الموبايل (Android Client .apk)' : 'Android Mobile Application (.apk)'}
                fileUrl={form.mobile_download_url}
                onUploadSuccess={(url) => setForm({ ...form, mobile_download_url: url })}
                accept=".apk"
                t={t}
              />
            </div>
          </div>
        )}
      </div>

      {/* Floating Save Bar with keyboard-safe margins */}
      <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-white/5 pb-10">
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

// FileUploaderCard
const FileUploaderCard = ({ label, fileUrl, onUploadSuccess, accept, t }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
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
        onUploadSuccess(res.data.url);
        toast.success(t('admin.platform_config.media_uploaded') || 'File uploaded successfully');
      }
    } catch (err) {
      toast.error('Upload failed. Ensure file format and size is within server limits.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-4 sm:p-5 space-y-4 flex flex-col justify-between h-full min-h-[160px]">
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
            No media file selected
          </div>
        )}
      </div>

      <div className="flex items-center justify-center w-full mt-3">
        <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition p-2 text-center">
          <span className="text-xs text-blue-500 font-bold">
            {uploading ? 'Uploading...' : 'Upload File'}
          </span>
          <input type="file" className="hidden" accept={accept} onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
    </Card>
  );
};

export default PlatformSettings;

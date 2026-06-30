import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { serverURL } from '../constants';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { 
  LuGlobe, 
  LuPalette, 
  LuVideo, 
  LuCreditCard, 
  LuFlag, 
  LuSearch, 
  LuDownload,
  LuSparkles,
  LuChartBar,
  LuCircleCheck,
  LuLanguages,
  LuMessageSquare,
  LuArrowRight,
  LuTrash2,
  LuPencil,
  LuChevronUp,


  LuChevronDown,
  LuPlus,
  LuCloudUpload
} from 'react-icons/lu';



const PlatformSettings = () => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('identity'); 
  const [heroMediaSource, setHeroMediaSource] = useState('upload'); // 'upload' | 'link'
  const [posterSource, setPosterSource] = useState('upload'); // 'upload' | 'link'
  const [fallbackSource, setFallbackSource] = useState('upload'); // 'upload' | 'link'
  
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

    // Landing Page Customizations
    landing_features_kicker_en: '',
    landing_features_kicker_ar: '',
    landing_features_title_en: '',
    landing_features_title_ar: '',
    landing_features_accent_en: '',
    landing_features_accent_ar: '',
    landing_steps_kicker_en: '',
    landing_steps_kicker_ar: '',
    landing_steps_title_en: '',
    landing_steps_title_ar: '',
    landing_steps_accent_en: '',
    landing_steps_accent_ar: '',
    landing_reviews_kicker_en: '',
    landing_reviews_kicker_ar: '',
    landing_reviews_title_en: '',
    landing_reviews_title_ar: '',
    landing_reviews_accent_en: '',
    landing_reviews_accent_ar: '',
    landing_cta_title_en: '',
    landing_cta_title_ar: '',
    landing_cta_subtitle_en: '',
    landing_cta_subtitle_ar: '',
    landing_cta_btn_en: '',
    landing_cta_btn_ar: '',
    landing_features_list: [],
    landing_steps_list: [],
    landing_reviews_list: [],
  });

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${serverURL}/admin/platform-settings`, {
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
        landing_features_list: Array.isArray(res.data.landing_features_list) ? res.data.landing_features_list : [],
        landing_steps_list: Array.isArray(res.data.landing_steps_list) ? res.data.landing_steps_list : [],
        landing_reviews_list: Array.isArray(res.data.landing_reviews_list) ? res.data.landing_reviews_list : [],
      }));

      const isHeroUploaded = res.data.hero_media_url && res.data.hero_media_url.startsWith('/storage/');
      setHeroMediaSource(isHeroUploaded || !res.data.hero_media_url ? 'upload' : 'link');

      const isPosterUploaded = res.data.hero_media_poster && res.data.hero_media_poster.startsWith('/storage/');
      setPosterSource(isPosterUploaded || !res.data.hero_media_poster ? 'upload' : 'link');

      const isFallbackUploaded = res.data.hero_video_fallback_image && res.data.hero_video_fallback_image.startsWith('/storage/');
      setFallbackSource(isFallbackUploaded || !res.data.hero_video_fallback_image ? 'upload' : 'link');
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
      await axios.put(`${serverURL}/admin/platform-settings`, form, {
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
    { id: 'identity', name: isRtl ? 'الهوية والشعار' : 'Identity & Branding', icon: LuGlobe },
    { id: 'theme', name: isRtl ? 'مظهر المنصة' : 'Theme Settings', icon: LuPalette },
    { id: 'hero', name: isRtl ? 'الصفحة الرئيسية — قسم البطل' : 'Landing — Hero Section', icon: LuVideo },
    { id: 'landing', name: isRtl ? 'الصفحة الرئيسية — الأقسام' : 'Landing — Page Sections', icon: LuGlobe },
    { id: 'payments', name: isRtl ? 'المدفوعات والظهور' : 'Payments & Visibility', icon: LuCreditCard },
    { id: 'features', name: isRtl ? 'مفاتيح الميزات' : 'Feature Flags', icon: LuFlag },
    { id: 'seo', name: isRtl ? 'محركات البحث والـ SEO' : 'SEO & Meta Tags', icon: LuSearch },
    { id: 'apps', name: isRtl ? 'التطبيقات والتحميل' : 'App Downloads', icon: LuDownload },
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
        
        {activeTab === 'identity' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Info notice */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/15 text-sm text-blue-700 dark:text-blue-300">
              <span className="text-lg leading-none">ℹ️</span>
              <p className="text-xs font-medium leading-relaxed">
                {isRtl
                  ? 'تغييرات الشعار والفافيكون وعنوان المنصة ستُطبَّق فور الحفظ وإعادة تحميل الصفحة. اللوجو الجديد سيظهر في كل مكان يستخدم مكوّن اللوجو.'
                  : 'Logo, favicon, and platform name changes apply immediately after saving and reloading the page. The new logo will appear everywhere the Logo component is used.'}
              </p>
            </div>

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
                {isRtl ? 'تخصيص وسائط الهيرو والواجهة الرئيسية' : 'Hero Section Media Customizer'}
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Media Type & Source Selection */}
                <div className="space-y-6 lg:col-span-2">
                  <div className="space-y-4 p-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 rounded-2xl">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      {isRtl ? 'الخطوة 1: حدد نوع الوسائط' : 'Step 1: Select Media Format'}
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'image', label: isRtl ? '🖼️ صورة' : '🖼️ Image' },
                        { key: 'video', label: isRtl ? '🎥 فيديو' : '🎥 Video' }
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setForm({ ...form, hero_media_type: item.key })}
                          className={`py-3 rounded-xl text-xs font-bold transition border cursor-pointer ${form.hero_media_type === item.key ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 shadow-sm' : 'border-gray-200 bg-white text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300'}`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 p-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 rounded-2xl">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      {isRtl ? 'الخطوة 2: حدد مصدر الملف' : 'Step 2: Select Media Source'}
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'upload', label: isRtl ? '💻 رفع من الجهاز' : '💻 Upload from Device' },
                        { key: 'link', label: isRtl ? '🔗 رابط خارجي (URL)' : '🔗 External Link (URL)' }
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setHeroMediaSource(item.key)}
                          className={`py-3 rounded-xl text-xs font-bold transition border cursor-pointer ${heroMediaSource === item.key ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 shadow-sm' : 'border-gray-200 bg-white text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300'}`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-white/5">
                      {heroMediaSource === 'upload' ? (
                        <FileUploaderCard
                          label={form.hero_media_type === 'video' ? (isRtl ? 'اختر ملف الفيديو من جهازك' : 'Choose Local Video File') : (isRtl ? 'اختر ملف الصورة من جهازك' : 'Choose Local Image File')}
                          fileUrl={form.hero_media_url}
                          onUploadSuccess={(url) => setForm({ ...form, hero_media_url: url })}
                          accept={form.hero_media_type === 'video' ? 'video/*' : 'image/*'}
                          t={t}
                        />
                      ) : (
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            {isRtl ? 'رابط ملف الوسائط الخارجي (URL)' : 'External Media URL Link'}
                          </label>
                          <input
                            type="text"
                            value={form.hero_media_url || ''}
                            onChange={(e) => setForm({ ...form, hero_media_url: e.target.value })}
                            placeholder={form.hero_media_type === 'video' ? 'https://example.com/video.mp4' : 'https://example.com/image.jpg'}
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                          />
                          <p className="text-[10px] text-gray-400">
                            {isRtl ? 'أدخل رابطاً مباشراً يبدأ بـ http:// أو https://' : 'Enter a direct media URL starting with http:// or https://'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Video Options (Shown only if format is Video) */}
                  {form.hero_media_type === 'video' && (
                    <div className="space-y-4 p-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 rounded-2xl">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {isRtl ? 'التحكم في تشغيل وسلوك الفيديو' : 'Video Playback Controls'}
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 text-xs">
                          <span className="font-bold text-gray-600 dark:text-gray-300">{isRtl ? 'تشغيل تلقائي للفيديو' : 'Autoplay Video'}</span>
                          <button
                            type="button"
                            onClick={() => toggle('hero_video_autoplay')}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${form.hero_video_autoplay ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`}
                          >
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${form.hero_video_autoplay ? (isRtl ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'}`} />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 text-xs">
                          <span className="font-bold text-gray-600 dark:text-gray-300">{isRtl ? 'تشغيل مكتوم الصوت' : 'Play Muted'}</span>
                          <button
                            type="button"
                            onClick={() => toggle('hero_media_muted')}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${form.hero_media_muted ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`}
                          >
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${form.hero_media_muted ? (isRtl ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 text-xs">
                          <span className="font-bold text-gray-600 dark:text-gray-300">{isRtl ? 'إخفاء عناصر التحكم بالفيديو' : 'Hide Controls UI'}</span>
                          <button
                            type="button"
                            onClick={() => toggle('hero_video_controls_hidden')}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${form.hero_video_controls_hidden ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`}
                          >
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${form.hero_video_controls_hidden ? (isRtl ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 text-xs">
                          <span className="font-bold text-gray-600 dark:text-gray-300">{isRtl ? 'بديل عند ضعف الإنترنت' : 'Fallback on Low Bandwidth'}</span>
                          <button
                            type="button"
                            onClick={() => toggle('hero_video_replace_low_bandwidth')}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${form.hero_video_replace_low_bandwidth ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`}
                          >
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${form.hero_video_replace_low_bandwidth ? (isRtl ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'}`} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                        <div className="space-y-1">
                          <span className="font-bold text-xs text-gray-600 dark:text-gray-300 block">{isRtl ? 'وضع التكرار' : 'Loop Mode'}</span>
                          <select
                            value={form.hero_video_loop_mode}
                            onChange={(e) => setForm({ ...form, hero_video_loop_mode: e.target.value })}
                            className="w-full text-xs rounded-xl border border-gray-200 bg-white p-2 text-gray-900 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                          >
                            <option className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white" value="loop_forever">{isRtl ? 'تكرار مستمر للأبد' : 'Loop Forever'}</option>
                            <option className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white" value="play_once">{isRtl ? 'تشغيل مرة واحدة والتوقف' : 'Play Once & Stop'}</option>
                            <option className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white" value="play_once_then_image">{isRtl ? 'تشغيل مرة واحدة ثم عرض الصورة البديلة' : 'Play Once, then show Fallback'}</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <span className="font-bold text-xs text-gray-600 dark:text-gray-300 block">{isRtl ? 'العميل المستهدف' : 'Target Client'}</span>
                          <select
                            value={form.hero_video_display_target}
                            onChange={(e) => setForm({ ...form, hero_video_display_target: e.target.value })}
                            className="w-full text-xs rounded-xl border border-gray-200 bg-white p-2 text-gray-900 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                          >
                            <option className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white" value="both">{isRtl ? 'الويب والهاتف معاً' : 'Both Web & Mobile'}</option>
                            <option className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white" value="web_only">{isRtl ? 'الويب فقط' : 'Web Client Only'}</option>
                            <option className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white" value="mobile_only">{isRtl ? 'الهاتف فقط' : 'Mobile Client Only'}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Video Cover / Fallback Images Customizers (Shown only if Video format) */}
                <div className="space-y-4">
                  {form.hero_media_type === 'video' ? (
                    <>
                      {/* Video Poster Section */}
                      <div className="p-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            {isRtl ? 'صورة غلاف الفيديو (أثناء التحميل)' : 'Video Poster (Loading Image)'}
                          </h4>
                          <div className="flex gap-1.5 text-[9px] font-bold">
                            <button
                              type="button"
                              onClick={() => setPosterSource('upload')}
                              className={`px-2 py-0.5 rounded-lg border ${posterSource === 'upload' ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 dark:border-white/10 text-gray-400'}`}
                            >
                              {isRtl ? 'جهاز' : 'Device'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setPosterSource('link')}
                              className={`px-2 py-0.5 rounded-lg border ${posterSource === 'link' ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 dark:border-white/10 text-gray-400'}`}
                            >
                              {isRtl ? 'رابط' : 'Link'}
                            </button>
                          </div>
                        </div>

                        {posterSource === 'upload' ? (
                          <FileUploaderCard
                            label={isRtl ? 'تحميل صورة الغلاف' : 'Upload Poster Image'}
                            fileUrl={form.hero_media_poster}
                            onUploadSuccess={(url) => setForm({ ...form, hero_media_poster: url })}
                            accept="image/*"
                            t={t}
                          />
                        ) : (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={form.hero_media_poster || ''}
                              onChange={(e) => setForm({ ...form, hero_media_poster: e.target.value })}
                              placeholder="https://example.com/poster.jpg"
                              className="w-full text-xs rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            />
                          </div>
                        )}
                      </div>

                      {/* Video Fallback Section */}
                      <div className="p-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            {isRtl ? 'الصورة البديلة للفيديو' : 'Video Fallback Image'}
                          </h4>
                          <div className="flex gap-1.5 text-[9px] font-bold">
                            <button
                              type="button"
                              onClick={() => setFallbackSource('upload')}
                              className={`px-2 py-0.5 rounded-lg border ${fallbackSource === 'upload' ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 dark:border-white/10 text-gray-400'}`}
                            >
                              {isRtl ? 'جهاز' : 'Device'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setFallbackSource('link')}
                              className={`px-2 py-0.5 rounded-lg border ${fallbackSource === 'link' ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 dark:border-white/10 text-gray-400'}`}
                            >
                              {isRtl ? 'رابط' : 'Link'}
                            </button>
                          </div>
                        </div>

                        {fallbackSource === 'upload' ? (
                          <FileUploaderCard
                            label={isRtl ? 'تحميل الصورة البديلة' : 'Upload Fallback Image'}
                            fileUrl={form.hero_video_fallback_image}
                            onUploadSuccess={(url) => setForm({ ...form, hero_video_fallback_image: url })}
                            accept="image/*"
                            t={t}
                          />
                        ) : (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={form.hero_video_fallback_image || ''}
                              onChange={(e) => setForm({ ...form, hero_video_fallback_image: e.target.value })}
                              placeholder="https://example.com/fallback.jpg"
                              className="w-full text-xs rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            />
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    // Helper notice for Image mode
                    <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-xs text-blue-600 dark:text-blue-300 leading-relaxed">
                      💡 <strong>{isRtl ? 'ملاحظة:' : 'Tip:'}</strong><br />
                      {isRtl 
                        ? 'أنت الآن في وضع الصورة. سيتم استخدام ملف الصورة المحدد في الخطوة السابقة لعرضه في واجهة الموقع وتطبيق الموبايل كغلاف رئيسي مباشرة.'
                        : 'You are currently in Image Mode. The image file chosen in the previous step will be displayed as the main banner on the website and mobile app.'}
                    </div>
                  )}
                </div>

              </div>
            </Card>
          </div>
        )}


        {/* Tab Landing: Landing Page Sections */}
        {activeTab === 'landing' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Features Section customization */}
            <Card className="p-4 sm:p-6 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                {isRtl ? 'تخصيص قسم المميزات' : 'Features Section Customization'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Features Kicker (English)</label>
                  <input
                    type="text"
                    value={form.landing_features_kicker_en}
                    onChange={(e) => setForm({ ...form, landing_features_kicker_en: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">الكلام المساعد لقسم المميزات (العربية)</label>
                  <input
                    type="text"
                    value={form.landing_features_kicker_ar}
                    onChange={(e) => setForm({ ...form, landing_features_kicker_ar: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Features Title (English) - use "|" to highlight accent</label>
                  <input
                    type="text"
                    value={form.landing_features_title_en}
                    onChange={(e) => setForm({ ...form, landing_features_title_en: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">عنوان المميزات (العربية) - استخدم "|" لتمييز الكلمة الملونة</label>
                  <input
                    type="text"
                    value={form.landing_features_title_ar}
                    onChange={(e) => setForm({ ...form, landing_features_title_ar: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                <ListEditor
                  title={isRtl ? 'قائمة عناصر قسم المميزات' : 'Features Section Items'}
                  items={form.landing_features_list || []}
                  onChange={(newList) => setForm({ ...form, landing_features_list: newList })}
                  schema={featuresSchema}
                  isRtl={isRtl}
                />
              </div>
            </Card>

            {/* Steps Section Customization */}
            <Card className="p-4 sm:p-6 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                {isRtl ? 'تخصيص قسم خطوات العمل' : 'How it Works Section Customization'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Steps Kicker (English)</label>
                  <input
                    type="text"
                    value={form.landing_steps_kicker_en}
                    onChange={(e) => setForm({ ...form, landing_steps_kicker_en: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">نص الكيكر للخطوات (العربية)</label>
                  <input
                    type="text"
                    value={form.landing_steps_kicker_ar}
                    onChange={(e) => setForm({ ...form, landing_steps_kicker_ar: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Steps Title (English) - use "|" to highlight accent</label>
                  <input
                    type="text"
                    value={form.landing_steps_title_en}
                    onChange={(e) => setForm({ ...form, landing_steps_title_en: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">عنوان الخطوات (العربية) - استخدم "|" لتمييز الكلمة الملونة</label>
                  <input
                    type="text"
                    value={form.landing_steps_title_ar}
                    onChange={(e) => setForm({ ...form, landing_steps_title_ar: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                <ListEditor
                  title={isRtl ? 'قائمة عناصر خطوات العمل' : 'How it Works Items'}
                  items={form.landing_steps_list || []}
                  onChange={(newList) => setForm({ ...form, landing_steps_list: newList })}
                  schema={stepsSchema}
                  isRtl={isRtl}
                />
              </div>
            </Card>

            {/* Testimonials Section Customization */}
            <Card className="p-4 sm:p-6 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                {isRtl ? 'تخصيص قسم آراء العملاء' : 'Testimonials Section Customization'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Reviews Kicker (English)</label>
                  <input
                    type="text"
                    value={form.landing_reviews_kicker_en}
                    onChange={(e) => setForm({ ...form, landing_reviews_kicker_en: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">نص الكيكر للآراء (العربية)</label>
                  <input
                    type="text"
                    value={form.landing_reviews_kicker_ar}
                    onChange={(e) => setForm({ ...form, landing_reviews_kicker_ar: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Reviews Title (English) - use "|" to highlight accent</label>
                  <input
                    type="text"
                    value={form.landing_reviews_title_en}
                    onChange={(e) => setForm({ ...form, landing_reviews_title_en: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">عنوان الآراء (العربية) - استخدم "|" لتمييز الكلمة الملونة</label>
                  <input
                    type="text"
                    value={form.landing_reviews_title_ar}
                    onChange={(e) => setForm({ ...form, landing_reviews_title_ar: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                <ListEditor
                  title={isRtl ? 'آراء وتقييمات العملاء والطلاب' : 'Student & Educator Testimonials'}
                  items={form.landing_reviews_list || []}
                  onChange={(newList) => setForm({ ...form, landing_reviews_list: newList })}
                  schema={reviewsSchema}
                  isRtl={isRtl}
                />
              </div>
            </Card>

            {/* CTA Banner customization */}
            <Card className="p-4 sm:p-6 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                {isRtl ? 'تخصيص بانر الحث على اتخاذ إجراء (CTA Banner)' : 'CTA Banner Customization'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">CTA Title (English)</label>
                  <input
                    type="text"
                    value={form.landing_cta_title_en}
                    onChange={(e) => setForm({ ...form, landing_cta_title_en: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">عنوان البانر (العربية)</label>
                  <input
                    type="text"
                    value={form.landing_cta_title_ar}
                    onChange={(e) => setForm({ ...form, landing_cta_title_ar: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">CTA Subtitle (English)</label>
                  <textarea
                    value={form.landing_cta_subtitle_en}
                    onChange={(e) => setForm({ ...form, landing_cta_subtitle_en: e.target.value })}
                    className="w-full min-h-[80px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">الوصف الفرعي للبانر (العربية)</label>
                  <textarea
                    value={form.landing_cta_subtitle_ar}
                    onChange={(e) => setForm({ ...form, landing_cta_subtitle_ar: e.target.value })}
                    className="w-full min-h-[80px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">CTA Button (English)</label>
                  <input
                    type="text"
                    value={form.landing_cta_btn_en}
                    onChange={(e) => setForm({ ...form, landing_cta_btn_en: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">نص زر البانر (العربية)</label>
                  <input
                    type="text"
                    value={form.landing_cta_btn_ar}
                    onChange={(e) => setForm({ ...form, landing_cta_btn_ar: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    dir="rtl"
                  />
                </div>
              </div>
            </Card>
          </div>
        )}



        {/* Tab: Payments & Visibility */}
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

// Schemas for ListEditor
const featuresSchema = [
  { key: 'icon', label: 'Icon / الأيقونة', type: 'select', options: [
    { value: 'LuSparkles', label: 'Sparkles (بريق)' },
    { value: 'LuChartBar', label: 'Chart Bar (مخطط)' },
    { value: 'LuCircleCheck', label: 'Circle Check (تحقق)' },
    { value: 'LuLanguages', label: 'Languages (لغات)' },
    { value: 'LuMessageSquare', label: 'Message (رسائل)' },
    { value: 'LuDownload', label: 'Download (تحميل)' },
    { value: 'LuArrowRight', label: 'Arrow Right (سهم يمين)' }
  ], defaultValue: 'LuSparkles' },
  { key: 'title_en', label: 'Title (English)', type: 'text' },
  { key: 'title_ar', label: 'العنوان بالعربية', type: 'text', dir: 'rtl' },
  { key: 'desc_en', label: 'Description (English)', type: 'textarea' },
  { key: 'desc_ar', label: 'الوصف بالعربية', type: 'textarea', dir: 'rtl' }
];

const stepsSchema = [
  { key: 'icon', label: 'Icon / الأيقونة', type: 'select', options: [
    { value: 'LuSparkles', label: 'Sparkles (بريق)' },
    { value: 'LuChartBar', label: 'Chart Bar (مخطط)' },
    { value: 'LuCircleCheck', label: 'Circle Check (تحقق)' },
    { value: 'LuLanguages', label: 'Languages (لغات)' },
    { value: 'LuMessageSquare', label: 'Message (رسائل)' },
    { value: 'LuDownload', label: 'Download (تحميل)' },
    { value: 'LuArrowRight', label: 'Arrow Right (سهم يمين)' }
  ], defaultValue: 'LuSparkles' },
  { key: 'title_en', label: 'Title (English)', type: 'text' },
  { key: 'title_ar', label: 'العنوان بالعربية', type: 'text', dir: 'rtl' },
  { key: 'desc_en', label: 'Description (English)', type: 'textarea' },
  { key: 'desc_ar', label: 'الوصف بالعربية', type: 'textarea', dir: 'rtl' }
];

const reviewsSchema = [
  { key: 'name', label: 'Author Name / الاسم', type: 'text' },
  { key: 'avatar', label: 'Initials / الحروف الأولى', type: 'text', defaultValue: 'SA' },
  { key: 'role_en', label: 'Role (English)', type: 'text' },
  { key: 'role_ar', label: 'الوظيفة بالعربية', type: 'text', dir: 'rtl' },
  { key: 'quote_en', label: 'Quote (English)', type: 'textarea' },
  { key: 'quote_ar', label: 'الرأي بالعربية', type: 'textarea', dir: 'rtl' }
];

// Interactive ListEditor Component (Replaces JSON Array Textareas)
const ListEditor = ({ title, items, onChange, schema, isRtl }) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleAdd = () => {
    const newItem = {};
    schema.forEach(field => {
      newItem[field.key] = field.defaultValue || '';
    });
    newItem.key = 'item_' + Date.now();
    const updated = [...items, newItem];
    onChange(updated);
    setEditingIndex(updated.length - 1);
    setEditForm(newItem);
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditForm({ ...items[index] });
  };

  const handleSave = () => {
    if (editingIndex === null) return;
    const updated = [...items];
    updated[editingIndex] = editForm;
    onChange(updated);
    setEditingIndex(null);
    setEditForm({});
  };

  const handleDelete = (index) => {
    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditForm({});
    }
  };

  const handleMove = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-white/5">
        <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">{title}</label>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer shadow-lg shadow-blue-500/10 active:scale-95"
        >
          <LuPlus size={14} />
          <span>{isRtl ? 'إضافة عنصر' : 'Add Item'}</span>
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={item.key || idx} className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 transition hover:border-gray-200 dark:hover:border-white/10">
            {editingIndex === idx ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {schema.map((field) => (
                    <div key={field.key} className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{field.label}</label>
                      {field.type === 'select' ? (
                        <select
                          value={editForm[field.key] || ''}
                          onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                          className="w-full text-xs rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white cursor-pointer"
                        >
                          {field.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          value={editForm[field.key] || ''}
                          onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                          className="w-full min-h-[70px] text-xs rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                          dir={field.dir}
                        />
                      ) : (
                        <input
                          type="text"
                          value={editForm[field.key] || ''}
                          onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                          className="w-full text-xs rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                          dir={field.dir}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-gray-200/50 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingIndex(null);
                      setEditForm({});
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition cursor-pointer"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-600 hover:bg-green-700 text-white transition cursor-pointer"
                  >
                    {isRtl ? 'حفظ العنصر' : 'Save Item'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {item.icon && (
                      <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 text-sm flex items-center justify-center shrink-0">
                        {item.icon === 'LuSparkles' && <LuSparkles size={14} />}
                        {item.icon === 'LuChartBar' && <LuChartBar size={14} />}
                        {item.icon === 'LuCircleCheck' && <LuCircleCheck size={14} />}
                        {item.icon === 'LuLanguages' && <LuLanguages size={14} />}
                        {item.icon === 'LuMessageSquare' && <LuMessageSquare size={14} />}
                        {item.icon === 'LuDownload' && <LuDownload size={14} />}
                        {item.icon === 'LuArrowRight' && <LuArrowRight size={14} />}
                        {!['LuSparkles','LuChartBar','LuCircleCheck','LuLanguages','LuMessageSquare','LuDownload','LuArrowRight'].includes(item.icon) && '🏷️'}
                      </span>
                    )}
                    {item.avatar && (
                      <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black flex items-center justify-center shrink-0">
                        {item.avatar}
                      </span>
                    )}
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {isRtl ? (item.title_ar || item.title_en || item.name) : (item.title_en || item.title_ar || item.name)}
                      {item.role_en && (
                        <span className="text-[10px] text-gray-400 font-bold ml-2 dark:text-gray-500">
                          — {isRtl ? (item.role_ar || item.role_en) : (item.role_en || item.role_ar)}
                        </span>
                      )}
                    </h4>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {isRtl ? (item.desc_ar || item.desc_en || item.quote_ar || item.quote_en) : (item.desc_en || item.desc_ar || item.quote_en || item.quote_ar)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleMove(idx, -1)}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 hover:text-gray-950 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                    title={isRtl ? 'تحريك لأعلى' : 'Move Up'}
                  >
                    <LuChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 1)}
                    disabled={idx === items.length - 1}
                    className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 hover:text-gray-950 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                    title={isRtl ? 'تحريك لأسفل' : 'Move Down'}
                  >
                    <LuChevronDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(idx)}
                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 transition cursor-pointer"
                    title={isRtl ? 'تعديل' : 'Edit'}
                  >
                    <LuPencil size={14} />
                  </button>


                  <button
                    type="button"
                    onClick={() => handleDelete(idx)}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition cursor-pointer"
                    title={isRtl ? 'حذف' : 'Delete'}
                  >
                    <LuTrash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-xs italic border border-dashed border-gray-200 dark:border-white/5 rounded-2xl">
            {isRtl ? 'لا توجد عناصر مضافة بعد.' : 'No items added yet.'}
          </div>
        )}
      </div>
    </div>
  );
};

// Redesigned FileUploaderCard (Premium Drag & Drop + Direct Live Preview)
const FileUploaderCard = ({ label, fileUrl, onUploadSuccess, accept, t }) => {
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleUpload = async (file) => {
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

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const fileAbsoluteUrl = fileUrl 
    ? (fileUrl.startsWith('http') ? fileUrl : `${serverURL.replace('/api', '')}${fileUrl}`)
    : '';

  const isImage = fileUrl && (
    fileUrl.match(/\.(jpeg|jpg|gif|png|webp|svg|ico)$/i) || 
    accept.includes('image')
  );

  const isVideo = fileUrl && (
    fileUrl.match(/\.(mp4|webm|ogg|mov|avi)$/i) || 
    accept.includes('video')
  );

  return (
    <Card 
      className={`p-5 flex flex-col justify-between transition-all duration-300 border-2 ${
        isDragOver 
          ? 'border-blue-500 bg-blue-500/5' 
          : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
          {fileUrl && (
            <button
              type="button"
              onClick={() => onUploadSuccess('')}
              className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Live Preview Area */}
        {fileUrl ? (
          <div className="rounded-xl overflow-hidden bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 p-2 mb-4">
            {isImage ? (
              <img 
                src={fileAbsoluteUrl} 
                alt={label} 
                className="max-h-36 w-full object-contain rounded-lg"
              />
            ) : isVideo ? (
              <video 
                src={fileAbsoluteUrl} 
                controls 
                className="max-h-36 w-full object-contain rounded-lg"
              />
            ) : (
              <div className="p-3 text-xs text-gray-600 dark:text-gray-300 truncate font-mono">
                {fileUrl}
              </div>
            )}
            <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400 px-1">
              <span className="truncate max-w-[70%]">{fileUrl}</span>
              <a 
                href={fileAbsoluteUrl} 
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 font-bold hover:underline"
              >
                View full
              </a>
            </div>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-white/[0.02] border border-dashed border-gray-200 dark:border-white/10 rounded-xl text-center text-xs text-gray-400 italic mb-4">
            <span className="text-xl mb-1"><LuCloudUpload size={24} className="text-gray-400" /></span>
            <span>Drag file here or choose from device</span>
          </div>
        )}
      </div>

      <div className="w-full">
        <label className="flex flex-col items-center justify-center w-full h-12 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer text-xs font-bold shadow-lg shadow-blue-500/10">
          <span>
            {uploading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </span>
            ) : (
              'Choose File'
            )}
          </span>
          <input 
            type="file" 
            className="hidden" 
            accept={accept} 
            onChange={(e) => handleUpload(e.target.files[0])} 
            disabled={uploading} 
          />
        </label>
      </div>
    </Card>
  );
};

export default PlatformSettings;

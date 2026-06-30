import React, { useEffect } from 'react';
import { BrowserRouter, HashRouter, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import UserLayout from './layouts/UserLayout';

// Public Pages
import Landing from './pages/landing';
import Features from './pages/features';
import Pricing from './pages/pricing';
import About from './pages/about';
import Contact from './pages/contact';
import TermsPolicy from './pages/termspolicy';
import PrivacyPolicy from './pages/privacypolicy';
import CancelPolicy from './pages/cancelpolicy';
import RefundPolicy from './pages/refundpolicy';
import BillingPolicy from './pages/billingpolicy';
import Blog from './pages/blog';
import BlogDetail from './pages/blogdetail';

// Auth Pages
import SignIn from './pages/signin';
import SignUp from './pages/signup';
import ForgotPassword from './pages/forgotpassword';
import ResetPassword from './pages/resetpassword';
import SocialCallback from './pages/socialcallback';

// User Pages
import Home from './pages/home';
import Create from './pages/create';
import Generating from './pages/generating';
import Topics from './pages/topics';
import AudioCourses from './pages/audiocourses';
import CourseDetail from './pages/coursedetail';
import AudioPlayer from './pages/audioplayer';
import Course from './pages/course';
import Quiz from './pages/quiz';
import Certificate from './pages/certificate';
import Profile from './pages/profile';
import Payment from './pages/payment';
import Manage from './pages/manage';
import Success from './pages/success';
import Successful from './pages/successful';
import Failed from './pages/failed';
import PaymentSuccess from './pages/paymentsuccess';
import PaymentFailed from './pages/paymentfailed';
import Pending from './pages/pending';
import SharedCourse from './pages/shared_course';
import DownloadApp from './pages/download';

import AdminLayout from './admin/components/AdminLayout';

// Admin Pages
import DashBoard from './admin/dashboard';
import Users from './admin/users';
import Courses from './admin/courses';
import PaidUsers from './admin/paidusers';
import Admins from './admin/admins';
import Contacts from './admin/contacts';
import Terms from './admin/terms';
import Privacy from './admin/privacy';
import Cancellation from './admin/cancellation';
import Refund from './admin/refund';
import Billing from './admin/billing';
import ManageBlogs from './admin/manageblogs';
import CreateBlog from './admin/createblog';
import EditBlog from './admin/editblog';
import AdminPlans from './admin/plans';
import PlatformSettings from './admin/platformsettings';
import ContentBlueprints from './admin/contentblueprints';
import SocialLinks from './admin/sociallinks';
import OfflinePayments from './admin/offlinepayments';

import Error from './pages/error';

import axios from 'axios';
import FingerprintService from './services/FingerprintService';

// Global Axios Interceptor for 401 Unauthorized & Device Tracking
axios.interceptors.request.use(async (config) => {
  const deviceId = await FingerprintService.getDeviceId();
  if (deviceId) {
    config.headers['X-Device-ID'] = deviceId;
  }

  // Add Accept-Language header for backend localization
  const currentLang = localStorage.getItem('i18nextLng') || 'en';
  config.headers['Accept-Language'] = currentLang.startsWith('ar') ? 'ar' : 'en';

  return config;
});

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Clear session and redirect to signin
      localStorage.clear();
      if (window.location.pathname !== '/signin') {
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);

function App() {
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    const stored = localStorage.getItem('darkMode');
    return stored === null ? true : stored === 'true';
  });

  const { serverURL } = require('./constants');

  useEffect(() => {
    const fetchThemeMode = async () => {
      try {
        const res = await axios.get(`${serverURL}/platform-settings`);
        if (res.data) {
          if (res.data.system_theme_mode) {
            localStorage.setItem('systemThemeMode', res.data.system_theme_mode);
          }
          if (res.data.theme_default_mode) {
            localStorage.setItem('themeDefaultMode', res.data.theme_default_mode);
          }
          window.dispatchEvent(new Event('themeChange'));
        }
      } catch (err) {
        console.error("Failed to fetch theme mode config", err);
      }
    };
    fetchThemeMode();
  }, [serverURL]);

  useEffect(() => {
    // Apply Dark Mode to HTML tag for Tailwind
    const applyTheme = () => {
      const mode = localStorage.getItem('systemThemeMode') || 'user_choice';
      let isDark = true;
      if (mode === 'light_only') {
        isDark = false;
      } else if (mode === 'dark_only') {
        isDark = true;
      } else if (mode === 'system_default') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        const stored = localStorage.getItem('darkMode');
        if (stored === null) {
          const defaultTheme = localStorage.getItem('themeDefaultMode') || 'dark';
          isDark = defaultTheme === 'dark';
        } else {
          isDark = stored === 'true';
        }
      }

      setIsDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    // Listen for theme changes
    window.addEventListener('themeChange', applyTheme);
    return () => window.removeEventListener('themeChange', applyTheme);
  }, []);

  const isDesktop = window.location.protocol === 'file:' || /electron/i.test(navigator.userAgent);
  const Router = isDesktop ? HashRouter : BrowserRouter;

  const isRtl = require('react-i18next').useTranslation().i18n.language.startsWith('ar');

  return (
    <Router>
      <div>
        <ToastContainer
          limit={3}
          position="bottom-center"
          autoClose={3000}
          theme={isDarkMode ? 'dark' : 'light'}
          rtl={isRtl}
        />

        <AnimatedRoutes />
      </div>
    </Router>
  );
}

function AnimatedRoutes() {
  const location = require('react-router-dom').useLocation();
  const { AnimatePresence } = require('framer-motion');

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname.startsWith('/admin') ? 'admin-layout' : location.pathname}>
        {/* 
            AUTH ROUTES 
            Standalone (No Navbar/Footer)
          */}
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/auth/social/callback" element={<SocialCallback />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* 
            PUBLIC ROUTES 
            Wrapped in PublicLayout (Contains Fixed Navbar & Footer)
          */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/download" element={<DownloadApp />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Policies */}
          <Route path="/terms" element={<TermsPolicy />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/cancellation" element={<CancelPolicy />} />
          <Route path="/refund" element={<RefundPolicy />} />
          <Route path="/billing" element={<BillingPolicy />} />
        </Route>

        {/* 
            USER ROUTES 
            Wrapped in UserLayout (Dashboard Sidenav/BottomNav)
          */}
        <Route element={<UserLayout />}>
          <Route path="/dashboard" element={<Home />} />
          <Route path="/dashboard/generate-course" element={<Create />} />
          <Route path="/generating" element={<Generating />} />
          <Route path="/dashboard/audio-courses" element={<AudioCourses />} />
          <Route path="/dashboard/audio-courses/:courseId" element={<CourseDetail />} />
          <Route path="/course-topics" element={<Topics />} />
          {/* Course & Quiz have their own full-screen layouts */}
          <Route path="/certificate" element={<Certificate />} />
          <Route path="/dashboard/profile" element={<Profile />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/dashboard/pricing" element={<Pricing />} />
          <Route path="/dashboard/download" element={<DownloadApp />} />
          <Route path="/dashboard/subscription" element={<Manage />} />
          <Route path="/success" element={<Success />} />
          <Route path="/successful" element={<Successful />} />
          <Route path="/failed" element={<Failed />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-failed" element={<PaymentFailed />} />
          <Route path="/pending" element={<Pending />} />

        </Route>

        {/* Standalone User Pages (Full Screen - No Sidebar) */}
        <Route path="/audio-player/:courseId" element={<AudioPlayer />} />
        <Route path="/share/:id" element={<SharedCourse />} />
        <Route path="/course/:courseId/*" element={<Course />} />
        <Route path="/course/:courseId/quiz" element={<Quiz />} />
        <Route path="/course/:courseId/certificate" element={<Certificate />} />

        {/* Admin Routes - Nested under Layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashBoard />} />
          <Route path="users" element={<Users />} />
          <Route path="courses" element={<Courses />} />
          <Route path="paid" element={<PaidUsers />} />
          <Route path="admins" element={<Admins />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="editterms" element={<Terms />} />
          <Route path="editprivacy" element={<Privacy />} />
          <Route path="editcancellation" element={<Cancellation />} />
          <Route path="editrefund" element={<Refund />} />
          <Route path="editbilling" element={<Billing />} />
          <Route path="manage-blogs" element={<ManageBlogs />} />
          <Route path="create-blog" element={<CreateBlog />} />
          <Route path="edit-blog/:slug" element={<EditBlog />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="platform-settings" element={<PlatformSettings />} />
          <Route path="content-blueprints" element={<ContentBlueprints />} />
          <Route path="offline-payments" element={<OfflinePayments />} />
          <Route path="social-links" element={<SocialLinks />} />
        </Route>

        {/* Catch All */}
        <Route path="*" element={<Error />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;

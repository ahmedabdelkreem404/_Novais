class ApiEndpoints {
  // Auth
  static const login = '/auth/login';
  static const register = '/auth/register';
  static const logout = '/auth/logout';
  static const forgotPassword = '/auth/forgot-password';
  static const resetPassword = '/auth/reset-password';
  static const verifyEmail = '/auth/verify-email';
  static const resendVerification = '/auth/resend-verification';
  static const userProfile = '/auth/user-profile';
  static const updateProfile = '/auth/user-profile';
  static const googleAuth = '/auth/google';
  static String validateResetToken(String token) => '/auth/validate-reset-token/$token';

  // Courses
  static const courses = '/courses';
  static const generateCourse = '/generate-course';
  static String course(int id) => '/courses/$id';
  static String updateCourse(int id) => '/courses/$id';
  static String deleteCourse(int id) => '/courses/$id';
  static String lesson(int courseId, int lessonId) =>
      '/courses/$courseId/lessons/$lessonId';
  static String createQuiz(int id) => '/courses/$id/quiz';
  static String getQuizzes(int id) => '/courses/$id/quiz';
  static String certificate(int id) => '/courses/$id/certificate';
  static String shareLink(int id) => '/courses/$id/share';
  static String exportPdf(int id) => '/courses/$id/export/pdf';
  static String exportPpt(int id) => '/courses/$id/export/ppt';
  static String chatHistory(int courseId) => '/courses/$courseId/chat/history';

  // Chat
  static const chat = '/chat';

  // Notes
  static const notes = '/notes';
  static String note(int id) => '/notes/$id';
  static String deleteNote(int id) => '/notes/$id';

  // Plans & Payment
  static const plans = '/plans';
  static const paymentCheckout = '/payment/checkout';
  static const cancelSubscription = '/payment/cancel-subscription';

  // Public
  static String sharedCourse(String token) => '/share/$token';
  static const blogs = '/blogs';
  static String blog(String slug) => '/blogs/$slug';
  static String page(String slug) => '/pages/$slug';
  static const contact = '/contact';
  static const socialLinks = '/social-links';

  // User settings
  static const darkMode = '/user/dark-mode';

  // Audio
  static const audioCourses = '/courses?type=audio';

  // AI
  static const generate = '/generate';
  static const generateLesson = '/generate-lesson';
  static const translateTitle = '/translate-title';
}

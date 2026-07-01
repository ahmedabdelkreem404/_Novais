import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../auth/auth_provider.dart';
import '../debug/novais_diagnostics.dart';

// ── Public / Landing
import '../../features/landing/landing_screen.dart';
import '../../features/misc/misc_screens.dart'
    show PolicyScreen, ErrorScreen, DownloadScreen;

// ── Auth
import '../../features/auth/signin_screen.dart';
import '../../features/auth/signup_screen.dart';
import '../../features/auth/forgot_password_screen.dart'
    show ForgotPasswordScreen, ResetPasswordScreen, VerifyEmailScreen;

// ── Dashboard / Shell
import '../../features/dashboard/shell_screen.dart';
import '../../features/dashboard/home_screen.dart';

// ── Create / Generate
import '../../features/create/create_screen.dart';
import '../../features/create/generating_screen.dart';

// ── Course viewer
import '../../features/course/course_screen.dart';

// ── Quiz
import '../../features/quiz/quiz_screen.dart';

// ── Audio
import '../../features/audio/audio_screen.dart'
    show AudioCoursesScreen, AudioPlayerScreen;

// ── Certificate
import '../../features/certificate/certificate_screen.dart';

// ── Profile
import '../../features/profile/profile_screen.dart';

// ── Payment
import '../../features/payment/pricing_screen.dart'
    show
        PricingScreen,
        PaymentScreen,
        PaymentResultScreen,
        ManageSubscriptionScreen;

// ── Notes
import '../../features/notes/notes_screen.dart';
import '../../features/notifications/notifications_screen.dart';

// ── Stub public pages (blog, contact, about, features, shared course)
// ── Stub public pages (blog, contact, about, features)
import '../../features/misc/stub_screens.dart';
import '../../features/shared_course/shared_course_screen.dart';
import '../../widgets/widgets.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      return mobileAuthRedirect(auth.status, state.uri.path);
    },
    routes: [
      // ── Public ──────────────────────────────────────────────────────────────
      GoRoute(path: '/', builder: (_, __) => const LandingScreen()),
      GoRoute(path: '/features', builder: (_, __) => const FeaturesScreen()),
      GoRoute(path: '/about', builder: (_, __) => const AboutScreen()),
      GoRoute(
        path: '/blog',
        builder: (_, __) => const BlogListScreen(),
        routes: [
          GoRoute(
            path: ':slug',
            builder: (_, state) =>
                BlogDetailScreen(slug: state.pathParameters['slug']!),
          ),
        ],
      ),
      GoRoute(path: '/contact', builder: (_, __) => const ContactScreen()),
      GoRoute(
        path: '/policy/:slug',
        builder: (_, state) =>
            PolicyScreen(slug: state.pathParameters['slug']!),
      ),
      GoRoute(path: '/download', builder: (_, __) => const DownloadScreen()),
      GoRoute(
        path: '/auth-loading',
        builder: (_, __) =>
            const Scaffold(body: NvLoading(message: 'Loading...')),
      ),

      // ── Auth ─────────────────────────────────────────────────────────────────
      GoRoute(
          path: '/forgot-password',
          builder: (_, __) => const ForgotPasswordScreen()),
      GoRoute(
        path: '/reset-password/:token',
        builder: (_, state) =>
            ResetPasswordScreen(token: state.pathParameters['token']!),
      ),
      GoRoute(
        path: '/verify-email',
        builder: (_, state) {
          final email = state.uri.queryParameters['email'] ?? '';
          return VerifyEmailScreen(email: email);
        },
      ),

      // ── Authenticated Shell (Bottom Nav) ─────────────────────────────────────
      ShellRoute(
        builder: (_, __, child) => ShellScreen(child: child),
        routes: [
          GoRoute(path: '/dashboard', builder: (_, __) => const HomeScreen()),
          GoRoute(path: '/create', builder: (_, __) => const CreateScreen()),
          GoRoute(
              path: '/audio', builder: (_, __) => const AudioCoursesScreen()),
          GoRoute(path: '/notes', builder: (_, __) => const NotesScreen()),
          GoRoute(
              path: '/notifications',
              builder: (_, __) => const NotificationsScreen()),
          GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
          GoRoute(path: '/signin', builder: (_, __) => const SignInScreen()),
          GoRoute(path: '/signup', builder: (_, __) => const SignUpScreen()),
          GoRoute(path: '/pricing', builder: (_, __) => const PricingScreen()),
        ],
      ),

      // ── Full-screen user routes ─────────────────────────────────────────────
      GoRoute(
        path: '/generating',
        builder: (_, state) {
          final data = state.extra as Map<String, dynamic>? ?? {};
          return GeneratingScreen(courseData: data);
        },
      ),
      GoRoute(
        path: '/course/:courseId',
        builder: (_, state) => CourseScreen(
          courseId: state.pathParameters['courseId']!,
        ),
      ),
      GoRoute(
        path: '/quiz/:courseId',
        builder: (_, state) =>
            QuizScreen(courseId: int.parse(state.pathParameters['courseId']!)),
      ),
      GoRoute(
        path: '/certificate/:courseId',
        builder: (_, state) => CertificateScreen(
          courseId: int.parse(state.pathParameters['courseId']!),
        ),
      ),
      GoRoute(
        path: '/audio/:courseId',
        builder: (_, state) => AudioPlayerScreen(
          courseId: int.parse(state.pathParameters['courseId']!),
        ),
      ),
      GoRoute(
        path: '/subscription',
        builder: (_, __) => const ManageSubscriptionScreen(),
      ),
      GoRoute(
        path: '/payment',
        builder: (_, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return PaymentScreen(planData: extra);
        },
      ),
      GoRoute(
        path: '/payment-success',
        builder: (_, __) => const PaymentResultScreen(success: true),
      ),
      GoRoute(
        path: '/payment-failed',
        builder: (_, __) => const PaymentResultScreen(success: false),
      ),
      GoRoute(
        path: '/share/:token',
        builder: (_, state) =>
            SharedCourseScreen(token: state.pathParameters['token']!),
      ),
    ],
    errorBuilder: (_, state) => ErrorScreen(message: state.error?.message),
  );
});

String? mobileAuthRedirect(AuthStatus status, String location) {
  final isAuth = status == AuthStatus.authenticated;
  final isUnknown = status == AuthStatus.unknown;
  final isLoading = location == '/auth-loading';
  String? decision;

  if (isUnknown) {
    final protectedPaths = [
      '/dashboard',
      '/create',
      '/generating',
      '/course',
      '/quiz',
      '/certificate',
      '/profile',
      '/payment',
      '/subscription',
      '/notes',
      '/notifications',
      '/audio',
    ];
    final isProtected = protectedPaths.any((path) => location.startsWith(path));
    if (isProtected) decision = isLoading ? null : '/auth-loading';
    _logRedirect(status, location, decision);
    return decision;
  }

  if (isLoading) {
    decision = isAuth ? '/dashboard' : '/signin';
    _logRedirect(status, location, decision);
    return decision;
  }

  final protectedPaths = [
    '/dashboard',
    '/create',
    '/generating',
    '/course',
    '/quiz',
    '/certificate',
    '/profile',
    '/payment',
    '/subscription',
    '/notes',
    '/notifications',
    '/audio',
  ];

  final isProtected = protectedPaths.any((path) => location.startsWith(path));

  if (!isAuth && isProtected) {
    decision = '/signin';
    _logRedirect(status, location, decision);
    return decision;
  }

  if (isAuth &&
      (location == '/signin' || location == '/signup' || location == '/')) {
    decision = '/dashboard';
    _logRedirect(status, location, decision);
    return decision;
  }

  _logRedirect(status, location, decision);
  return decision;
}

void _logRedirect(AuthStatus status, String location, String? decision) {
  NovaisDiagnostics.log(
    'Router',
    'status=${status.name} location=$location decision=${decision ?? 'stay'}',
  );
}

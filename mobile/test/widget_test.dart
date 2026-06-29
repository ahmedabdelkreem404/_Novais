// Basic smoke test for NOVAIS app
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:novais/core/api/api_client.dart';
import 'package:novais/core/api/safe_json.dart';
import 'package:novais/core/auth/auth_provider.dart';
import 'package:novais/core/l10n/app_localizations.dart';
import 'package:novais/core/router/app_router.dart';
import 'package:novais/features/auth/signin_screen.dart';
import 'package:novais/features/create/create_screen.dart';
import 'package:novais/features/create/generating_screen.dart';
import 'package:novais/features/dashboard/home_screen.dart';
import 'package:novais/features/dashboard/shell_screen.dart';
import 'package:novais/main.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('App starts without crashing', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: NovaisApp()));
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));
    // App initializes without throwing
    expect(find.byType(MaterialApp), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  test('auth loading state stays on loading route', () {
    expect(mobileAuthRedirect(AuthStatus.unknown, '/auth-loading'), isNull);
    expect(mobileAuthRedirect(AuthStatus.unknown, '/'), isNull);
    expect(mobileAuthRedirect(AuthStatus.unknown, '/create'), '/auth-loading');
  });

  test('authenticated bootstrap routes to dashboard', () {
    expect(mobileAuthRedirect(AuthStatus.authenticated, '/auth-loading'),
        '/dashboard');
    expect(
        mobileAuthRedirect(AuthStatus.authenticated, '/signin'), '/dashboard');
    expect(mobileAuthRedirect(AuthStatus.authenticated, '/'), '/dashboard');
  });

  test('unauthenticated protected routes go to signin', () {
    expect(mobileAuthRedirect(AuthStatus.unauthenticated, '/auth-loading'),
        '/signin');
    expect(mobileAuthRedirect(AuthStatus.unauthenticated, '/'), isNull);
    expect(mobileAuthRedirect(AuthStatus.unauthenticated, '/dashboard'),
        '/signin');
    expect(
        mobileAuthRedirect(AuthStatus.unauthenticated, '/create'), '/signin');
  });

  test('api decoder tolerates invalid unicode escapes in course payloads', () {
    final decoded = decodeNovaisJson(r'{"title":"Bad \user escape"}')
        as Map<String, dynamic>;

    expect(decoded['title'], r'Bad \user escape');
  });

  testWidgets('authenticated shell renders dashboard',
      (WidgetTester tester) async {
    await tester.pumpWidget(_testApp());
    await _pumpReady(tester);

    expect(find.byKey(const Key('dashboard_create_button')), findsOneWidget);
  });

  testWidgets('dashboard Create button tap navigates to create screen',
      (WidgetTester tester) async {
    await tester.pumpWidget(_testApp());
    await _pumpReady(tester);

    await tester.tap(find.byKey(const Key('dashboard_create_button')));
    await _pumpReady(tester);

    expect(find.byKey(const Key('create_topic_input')), findsOneWidget);
    expect(find.byKey(const Key('create_generate_button')), findsOneWidget);
  });

  testWidgets('drawer Create item tap navigates to create screen',
      (WidgetTester tester) async {
    await tester.pumpWidget(_testApp());
    await _pumpReady(tester);

    await tester.tap(find.byKey(const Key('shell_menu_button')));
    await _pumpReady(tester);
    await tester.tap(find.byKey(const Key('drawer_create_button')));
    await _pumpReady(tester);

    expect(find.byKey(const Key('create_topic_input')), findsOneWidget);
    expect(find.byKey(const Key('create_generate_button')), findsOneWidget);
  });

  testWidgets('drawer exposes platform parity language and theme actions',
      (WidgetTester tester) async {
    await tester.pumpWidget(_testApp());
    await _pumpReady(tester);

    await tester.tap(find.byKey(const Key('shell_menu_button')));
    await _pumpReady(tester);

    expect(find.byKey(const Key('drawer_language_button')), findsOneWidget);
    expect(find.byKey(const Key('drawer_theme_button')), findsOneWidget);
    expect(find.byKey(const Key('drawer_usage_card')), findsOneWidget);
  });

  testWidgets('Arabic localization renders readable Arabic',
      (WidgetTester tester) async {
    await tester.pumpWidget(_testApp(locale: const Locale('ar')));
    await _pumpReady(tester);

    await tester.tap(find.byKey(const Key('shell_menu_button')));
    await _pumpReady(tester);

    expect(find.text('إنشاء دورة'), findsWidgets);
    expect(find.text('الملف الشخصي'), findsOneWidget);
  });

  testWidgets('create screen accepts a topic and exposes generate button',
      (WidgetTester tester) async {
    await tester.pumpWidget(_testApp(initialLocation: '/create'));
    await _pumpReady(tester);

    await tester.enterText(
        find.byKey(const Key('create_topic_input')), 'Chess Basics');
    await tester.pump();

    expect(find.text('Chess Basics'), findsOneWidget);
    expect(find.byKey(const Key('create_generate_button')), findsOneWidget);
  });

  testWidgets('logout clears shell and routes to signin',
      (WidgetTester tester) async {
    await tester.pumpWidget(_testApp());
    await _pumpReady(tester);

    await tester.tap(find.byKey(const Key('shell_menu_button')));
    await _pumpReady(tester);
    await tester.tap(find.byIcon(Icons.logout));
    await _pumpReady(tester);

    expect(find.byType(SignInScreen), findsOneWidget);
  });

  testWidgets('generating flow saves outline and opens public course id',
      (WidgetTester tester) async {
    await tester.pumpWidget(_testApp(
      initialLocation: '/generating',
      generatingData: {
        'topic': 'Chess Basics',
        'subTopics': <String>[],
        'type': 'Theory & Image Course',
        'language': 'English',
        'level': 'Beginner',
        'numModules': 5,
      },
    ));

    await tester.pump();
    await tester.pump(const Duration(seconds: 11));
    await tester.pump(const Duration(seconds: 2));
    await tester.runAsync(() async {
      await Future<void>.delayed(const Duration(milliseconds: 100));
    });
    await _pumpReady(tester);

    expect(
      find.text('Course public-course-123'),
      findsOneWidget,
      reason: _visibleText(tester).join(' | '),
    );
  });
}

List<String> _visibleText(WidgetTester tester) {
  return tester
      .widgetList<Text>(find.byType(Text))
      .map((widget) => widget.data)
      .whereType<String>()
      .toList();
}

Future<void> _pumpReady(WidgetTester tester) async {
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 100));
  await tester.pump(const Duration(milliseconds: 300));
}

Widget _testApp({
  String initialLocation = '/dashboard',
  Map<String, dynamic>? generatingData,
  Locale locale = const Locale('en'),
}) {
  final router = GoRouter(
    initialLocation: initialLocation,
    routes: [
      ShellRoute(
        builder: (_, __, child) => ShellScreen(child: child),
        routes: [
          GoRoute(path: '/dashboard', builder: (_, __) => const HomeScreen()),
          GoRoute(path: '/create', builder: (_, __) => const CreateScreen()),
        ],
      ),
      GoRoute(path: '/signin', builder: (_, __) => const SignInScreen()),
      GoRoute(
        path: '/generating',
        builder: (_, __) => GeneratingScreen(courseData: generatingData ?? {}),
      ),
      GoRoute(
        path: '/course/:courseId',
        builder: (_, state) => Scaffold(
          body: Text('Course ${state.pathParameters['courseId']}'),
        ),
      ),
      GoRoute(
        path: '/pricing',
        builder: (_, __) => const Scaffold(body: Text('Pricing')),
      ),
    ],
  );

  return ProviderScope(
    overrides: [
      apiClientProvider.overrideWithValue(_fakeApiClient()),
    ],
    child: MaterialApp.router(
      routerConfig: router,
      debugShowCheckedModeBanner: false,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [Locale('en'), Locale('ar')],
      locale: locale,
    ),
  );
}

ApiClient _fakeApiClient() {
  final api = ApiClient();
  api.dio.interceptors.clear();
  api.dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) {
        if (options.path == '/courses' && options.method == 'GET') {
          handler.resolve(Response(
            requestOptions: options,
            statusCode: 200,
            data: <Map<String, dynamic>>[],
          ));
          return;
        }
        if (options.path == '/generate-course') {
          handler.resolve(Response(
            requestOptions: options,
            statusCode: 200,
            data: {
              'success': true,
              'data': {
                'title': 'Chess Basics',
                'chapters': [
                  {
                    'title': 'Opening Principles',
                    'subtopics': [
                      {'title': 'Control the center', 'theory': 'Learn why.'}
                    ],
                  }
                ],
              },
            },
          ));
          return;
        }
        if (options.path == '/courses' && options.method == 'POST') {
          handler.resolve(Response(
            requestOptions: options,
            statusCode: 201,
            data: {'success': true, 'courseId': 'public-course-123'},
          ));
          return;
        }
        if (options.path == '/auth/logout') {
          handler.resolve(Response(
            requestOptions: options,
            statusCode: 200,
            data: {'ok': true},
          ));
          return;
        }
        if (options.path == '/auth/user-profile') {
          handler.resolve(Response(
            requestOptions: options,
            statusCode: 200,
            data: {
              'user': {
                'id': 1,
                'name': 'Mobile Tester',
                'email': 'mobile@example.test',
                'subscription_type': 'free',
              }
            },
          ));
          return;
        }
        handler.resolve(Response(
          requestOptions: options,
          statusCode: 200,
          data: <String, dynamic>{},
        ));
      },
    ),
  );
  return api;
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:dio/dio.dart';
import 'package:novais/core/auth/auth_provider.dart';
import 'package:novais/core/api/api_client.dart';
import 'package:novais/core/l10n/app_localizations.dart';
import 'package:novais/features/dashboard/shell_screen.dart';
import 'package:novais/widgets/app_sidebar.dart';



void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const channel = MethodChannel('plugins.it_nomads.com/flutter_secure_storage');
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      .setMockMethodCallHandler(channel, (MethodCall methodCall) async {
    if (methodCall.method == 'read') {
      final key = methodCall.arguments['key'];
      if (key == 'jwt_token') {
        return 'mock_token';
      }
      if (key == 'user_id') {
        return '1';
      }
      return 'mock_val';
    }
    return null;
  });

  testWidgets('Arabic localization renders readable Arabic',
      (WidgetTester tester) async {
    await tester.pumpWidget(_localizedApp(
      locale: const Locale('ar'),
      child: const AppSidebar(),
    ));
    await tester.pumpAndSettle();

    expect(find.text('إنشاء دورة'), findsOneWidget);
    expect(find.text('الملف الشخصي'), findsOneWidget);
  });

  testWidgets('dashboard shell exposes language and theme actions',
      (WidgetTester tester) async {
    await tester.pumpWidget(_localizedApp(
      child: const ShellScreen(child: SizedBox.shrink()),
    ));
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('shell_menu_button')));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('drawer_language_button')), findsOneWidget);
    expect(find.byKey(const Key('drawer_theme_button')), findsOneWidget);
    expect(find.byKey(const Key('drawer_usage_card')), findsOneWidget);
  });
}

Widget _localizedApp({
  required Widget child,
  Locale locale = const Locale('en'),
}) {
  return ProviderScope(
    overrides: [
      apiClientProvider.overrideWithValue(_fakeApiClient()),
    ],
    child: MaterialApp(
      locale: locale,
      supportedLocales: const [Locale('en'), Locale('ar')],
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: child,
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

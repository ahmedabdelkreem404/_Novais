import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:novais/core/l10n/app_localizations.dart';
import 'package:novais/features/dashboard/shell_screen.dart';
import 'package:novais/widgets/app_sidebar.dart';

void main() {
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

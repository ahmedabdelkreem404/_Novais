// Basic smoke test for NOVAIS app
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:novais/core/auth/auth_provider.dart';
import 'package:novais/core/router/app_router.dart';
import 'package:novais/main.dart';

void main() {
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
    expect(mobileAuthRedirect(AuthStatus.unknown, '/'), '/auth-loading');
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
    expect(mobileAuthRedirect(AuthStatus.unauthenticated, '/'), '/signin');
    expect(mobileAuthRedirect(AuthStatus.unauthenticated, '/dashboard'),
        '/signin');
    expect(
        mobileAuthRedirect(AuthStatus.unauthenticated, '/create'), '/signin');
  });
}

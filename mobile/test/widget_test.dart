// Basic smoke test for NOVAIS app
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:novais/main.dart';

void main() {
  testWidgets('App starts without crashing', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: NovaisApp()));
    // App initializes without throwing
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}

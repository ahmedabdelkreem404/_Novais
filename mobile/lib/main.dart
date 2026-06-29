import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/l10n/app_localizations.dart';
import 'core/auth/auth_provider.dart';
import 'core/api/platform_config_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: NovaisApp()));
}

class NovaisApp extends ConsumerWidget {
  const NovaisApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    final themeMode = ref.watch(themeModeProvider);
    final locale = ref.watch(localeProvider);
    final configAsync = ref.watch(platformConfigProvider);

    ThemeMode activeThemeMode = themeMode;
    if (configAsync.hasValue) {
      final config = configAsync.value!;
      if (config.systemThemeMode == 'light_only') {
        activeThemeMode = ThemeMode.light;
      } else if (config.systemThemeMode == 'dark_only') {
        activeThemeMode = ThemeMode.dark;
      } else if (config.systemThemeMode == 'system_default') {
        activeThemeMode = ThemeMode.system;
      } else if (themeMode == ThemeMode.system) {
        activeThemeMode = config.themeDefaultMode == 'light' ? ThemeMode.light : ThemeMode.dark;
      }
    }

    return MaterialApp.router(
      title: 'NOVAIS',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: activeThemeMode,
      routerConfig: router,
      locale: locale,
      supportedLocales: const [Locale('en'), Locale('ar')],
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
    );
  }
}

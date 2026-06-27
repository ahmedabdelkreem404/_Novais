import 'package:flutter/material.dart';

class AppColors {
  // Primary / Accent (Tailwind Blue-600)
  static const primary = Color(0xFF2563EB);
  static const primaryDark = Color(0xFF1D4ED8); // Blue-700
  static const accent = Color(0xFF3B82F6);      // Blue-500

  // Light theme (Tailwind Slate-50)
  static const lightBg = Color(0xFFF8FAFC);
  static const lightBgElev = Color(0xFFFFFFFF);
  static const lightPanel = Color(0xFFFFFFFF);
  static const lightText = Color(0xFF020617);   // Slate-950
  static const lightMuted = Color(0xFF64748B);  // Slate-500
  static const lightSubtle = Color(0xFF94A3B8); // Slate-400
  static const lightBorder = Color(0xFFE2E8F0); // Slate-200

  // Dark theme (Tailwind Neutral-950 / Black)
  static const darkBg = Color(0xFF0A0A0A);      // Pure dark
  static const darkBgElev = Color(0xFF161616);  // Slightly lighter
  static const darkPanel = Color(0xFF161616);
  static const darkText = Color(0xFFF8FAFC);    // Slate-50
  static const darkMuted = Color(0xFF94A3B8);   // Slate-400
  static const darkSubtle = Color(0xFF475569);  // Slate-600
  static const darkBorder = Color(0xFF2A2A2A);

  // Status
  static const success = Color(0xFF22C55E); // Green-500
  static const warning = Color(0xFFEAB308); // Yellow-500
  static const error = Color(0xFFEF4444);   // Red-500

  // Gradients
  static const gradientStart = Color(0xFF2563EB); // Blue-600
  static const gradientEnd = Color(0xFF4F46E5);   // Indigo-600
}

class AppTheme {
  static ThemeData get lightTheme => _buildTheme(Brightness.light);
  static ThemeData get darkTheme => _buildTheme(Brightness.dark);

  static ThemeData _buildTheme(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final bg = isDark ? AppColors.darkBg : AppColors.lightBg;
    final bgElev = isDark ? AppColors.darkBgElev : AppColors.lightBgElev;
    final text = isDark ? AppColors.darkText : AppColors.lightText;
    final muted = isDark ? AppColors.darkMuted : AppColors.lightMuted;
    final border = isDark ? AppColors.darkBorder : AppColors.lightBorder;

    final baseTextTheme = TextTheme(
      titleLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: text),
      titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: text),
      bodyLarge: TextStyle(fontSize: 16, color: text),
      bodyMedium: TextStyle(fontSize: 14, color: text),
      bodySmall: TextStyle(fontSize: 12, color: muted),
      labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: text),
    );

    final textTheme = baseTextTheme.copyWith(
      displayLarge: TextStyle(fontSize: 40, fontWeight: FontWeight.w700, color: text),
      displayMedium: TextStyle(fontSize: 32, fontWeight: FontWeight.w700, color: text),
      headlineLarge: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: text),
      headlineMedium: TextStyle(fontSize: 22, fontWeight: FontWeight.w600, color: text),
      headlineSmall: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: text),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      scaffoldBackgroundColor: bg,
      colorScheme: ColorScheme(
        brightness: brightness,
        primary: AppColors.primary,
        onPrimary: Colors.white,
        secondary: AppColors.accent,
        onSecondary: Colors.white,
        error: AppColors.error,
        onError: Colors.white,
        surface: bgElev,
        onSurface: text,
      ),
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: bg,
        foregroundColor: text,
        elevation: 0,
        shadowColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: text,
        ),
      ),
      cardTheme: CardThemeData(
        color: bgElev,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(color: border, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: bgElev,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.error),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: TextStyle(color: muted, fontSize: 14),
        labelStyle: TextStyle(color: muted, fontSize: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.2,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          side: const BorderSide(color: AppColors.primary, width: 1.5),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        ),
      ),
      dividerTheme: DividerThemeData(color: border, thickness: 1, space: 1),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: bgElev,
        elevation: 0,
        indicatorColor: AppColors.primary.withAlpha(31),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const TextStyle(
                color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.w600);
          }
          return TextStyle(color: muted, fontSize: 12);
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: AppColors.primary, size: 24);
          }
          return IconThemeData(color: muted, size: 24);
        }),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: bgElev,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: isDark ? const Color(0xFF1E293B) : const Color(0xFF1E293B),
        contentTextStyle: const TextStyle(color: Colors.white, fontSize: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}

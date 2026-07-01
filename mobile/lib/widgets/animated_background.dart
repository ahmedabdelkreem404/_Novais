import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class AppAnimatedBackground extends StatelessWidget {
  const AppAnimatedBackground({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    const primary = AppColors.primary;
    const secondary = Color(0xFFA855F7); // Purple-500

    return Stack(
      children: [
        Positioned(
          top: -80,
          right: -85,
          child: _Blob(
            color: primary,
            isDark: isDark,
            size: 300,
          ),
        ),
        Positioned(
          bottom: -35,
          left: -65,
          child: _Blob(
            color: secondary,
            isDark: isDark,
            size: 250,
          ),
        ),
        Positioned(
          top: 170,
          left: 90,
          child: _Blob(
            color: Colors.teal,
            isDark: isDark,
            size: 200,
            opacity: 0.15,
          ),
        ),
      ],
    );
  }
}

class _Blob extends StatelessWidget {
  final Color color;
  final bool isDark;
  final double size;
  final double? opacity;

  const _Blob({
    required this.color,
    required this.isDark,
    required this.size,
    this.opacity,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withAlpha(isDark
            ? (255 * (opacity ?? 0.2)).toInt()
            : (255 * (opacity ?? 0.15)).toInt()),
        boxShadow: [
          BoxShadow(
            color: color.withAlpha(isDark
                ? (255 * (opacity ?? 0.4)).toInt()
                : (255 * (opacity ?? 0.3)).toInt()),
            blurRadius: 100,
            spreadRadius: 20,
          )
        ],
      ),
    );
  }
}

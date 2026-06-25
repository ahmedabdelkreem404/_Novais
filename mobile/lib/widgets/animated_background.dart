import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class AppAnimatedBackground extends StatefulWidget {
  const AppAnimatedBackground({super.key});

  @override
  State<AppAnimatedBackground> createState() => _AppAnimatedBackgroundState();
}

class _AppAnimatedBackgroundState extends State<AppAnimatedBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    const primary = AppColors.primary;
    const secondary = Color(0xFFA855F7); // Purple-500

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Stack(
          children: [
            // Blob 1 (Top Right)
            Positioned(
              top: -100 + (_controller.value * 50),
              right: -100 + (_controller.value * 30),
              child: _Blob(
                color: primary,
                isDark: isDark,
                size: 300,
              ),
            ),
            // Blob 2 (Bottom Left)
            Positioned(
              bottom: -50 + (_controller.value * 40),
              left: -50 - (_controller.value * 40),
              child: _Blob(
                color: secondary,
                isDark: isDark,
                size: 250,
              ),
            ),
             // Blob 3 (Center moves)
            Positioned(
              top: 200 + (_controller.value * -60),
              left: 50 + (_controller.value * 100),
              child: _Blob(
                color: Colors.teal,
                isDark: isDark,
                size: 200,
                opacity: 0.15,
              ),
            ),
          ],
        );
      },
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
        color: color.withAlpha(isDark ? (255 * (opacity ?? 0.2)).toInt() : (255 * (opacity ?? 0.15)).toInt()),
        boxShadow: [
          BoxShadow(
             color: color.withAlpha(isDark ? (255 * (opacity ?? 0.4)).toInt() : (255 * (opacity ?? 0.3)).toInt()),
             blurRadius: 100,
             spreadRadius: 20,
          )
        ],
      ),
    );
  }
}

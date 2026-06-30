import 'dart:ui';
import 'package:flutter/material.dart';
import '../core/api/api_client.dart';
import '../core/l10n/app_localizations.dart';
import '../core/theme/app_theme.dart';
import '../models/course.dart';

// ─── Primary Button ───────────────────────────────────────────────────────────

class NvButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final bool primary;
  final bool loading;
  final Widget? icon;
  final double? width;

  const NvButton({
    super.key,
    required this.label,
    this.onTap,
    this.primary = true,
    this.loading = false,
    this.icon,
    this.width,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width ?? double.infinity,
      height: 50,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary ? AppColors.primary : Colors.transparent,
          foregroundColor: primary ? Colors.white : AppColors.primary,
          elevation: primary ? 2 : 0,
          shadowColor: primary ? AppColors.primary.withAlpha(80) : null,
          side: primary
              ? null
              : const BorderSide(color: AppColors.primary, width: 1.5),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        onPressed: loading ? null : onTap,
        child: loading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.max,
                children: [
                  if (icon != null) ...[icon!, const SizedBox(width: 8)],
                  Flexible(
                    child: Text(label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontSize: 15, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
      ),
    );
  }
}

// ─── Text Field ───────────────────────────────────────────────────────────────

class NvTextField extends StatelessWidget {
  final String label;
  final String? hint;
  final Key? fieldKey;
  final TextEditingController? controller;
  final bool obscure;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;
  final Widget? suffix;
  final Widget? prefix;
  final int maxLines;
  final int? minLines;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onFieldSubmitted;
  final TextInputAction? textInputAction;

  const NvTextField({
    super.key,
    required this.label,
    this.hint,
    this.fieldKey,
    this.controller,
    this.obscure = false,
    this.keyboardType,
    this.validator,
    this.suffix,
    this.prefix,
    this.maxLines = 1,
    this.minLines,
    this.onChanged,
    this.onFieldSubmitted,
    this.textInputAction,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 6),
        TextFormField(
          key: fieldKey,
          controller: controller,
          obscureText: obscure,
          keyboardType: keyboardType,
          validator: validator,
          maxLines: obscure ? 1 : maxLines,
          minLines: minLines,
          onChanged: onChanged,
          onFieldSubmitted: onFieldSubmitted,
          textInputAction: textInputAction,
          decoration: InputDecoration(
            hintText: hint,
            suffixIcon: suffix,
            prefixIcon: prefix,
          ),
        ),
      ],
    );
  }
}

// ─── Course Card ───────────────────────────────────────────────────────────────

// ─── Course Card ───────────────────────────────────────────────────────────────

class NvCourseCard extends StatelessWidget {
  final Course course;
  final VoidCallback? onTap;
  final VoidCallback? onDelete;

  const NvCourseCard({
    super.key,
    required this.course,
    this.onTap,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final l10n = context.l10n;
    final progress = _calculateProgress(course);
    final chapterCount = course.lessons.length;
    final imageUrl = course.imageUrl == null
        ? null
        : ApiClient.resolveMediaUrl(course.imageUrl!);

    final isDocument = ['book', 'graduation-project', 'master-thesis'].contains(course.blueprintSlug);

    String badgeText = _courseTypeLabel(course.type, l10n);
    Color badgeColor = const Color(0xFF2563EB); // Blue-600

    if (course.blueprintSlug == 'graduation-project') {
      badgeText = l10n.isAr ? 'كتاب مشروع تخرج' : 'Graduation Project Book';
      badgeColor = const Color(0xFF6366F1); // Indigo
    } else if (course.blueprintSlug == 'master-thesis') {
      badgeText = l10n.isAr ? 'رسالة ماجستير' : 'Master Thesis';
      badgeColor = const Color(0xFF8B5CF6); // Purple
    } else if (course.blueprintSlug == 'book') {
      badgeText = l10n.isAr ? 'كتاب تعليمي' : 'Academic Book';
      badgeColor = const Color(0xFF0EA5E9); // Sky
    }

    return Semantics(
      label: 'course_card',
      button: true,
      child: GestureDetector(
        key: const Key('course_card'),
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF161616) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
                color:
                    isDark ? const Color(0xFF2A2A2A) : const Color(0xFFE5E7EB)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(isDark ? 50 : 15),
                blurRadius: 12,
                offset: const Offset(0, 4),
              )
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Image Section
              Expanded(
                flex: 4,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    ClipRRect(
                      borderRadius:
                          const BorderRadius.vertical(top: Radius.circular(16)),
                      child: imageUrl != null
                          ? Image.network(imageUrl,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => _placeholder())
                          : _placeholder(),
                    ),
                    // Gradient Overlay
                    Container(
                      decoration: BoxDecoration(
                        borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(16)),
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            Colors.black.withAlpha(150)
                          ],
                          stops: const [0.6, 1.0],
                        ),
                      ),
                    ),
                    // Badges
                    Positioned(
                      bottom: 10,
                      left: 10,
                      right: 10,
                      child: Row(
                        children: [
                          _Badge(
                            text: badgeText,
                            color: badgeColor,
                            textColor: Colors.white,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Content Section
              Expanded(
                flex: 3,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        course.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          height: 1.2,
                          fontFamily: 'PlusJakartaSans',
                        ),
                      ),
                      Column(
                        children: [
                          if (!isDocument) ...[
                            // Progress Bar
                            ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: progress / 100,
                                backgroundColor:
                                    isDark ? Colors.white10 : Colors.grey[200],
                                valueColor: const AlwaysStoppedAnimation<Color>(
                                    AppColors.primary),
                                minHeight: 6,
                              ),
                            ),
                            const SizedBox(height: 8),
                          ],

                          // Footer Stats
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              if (isDocument)
                                Text(
                                  l10n.isAr ? 'وثيقة أكاديمية' : 'Academic Document',
                                  style: TextStyle(
                                      fontSize: 11,
                                      color: isDark
                                          ? Colors.grey[400]
                                          : Colors.grey[500],
                                      fontWeight: FontWeight.w600),
                                )
                              else
                                Text('$progress% ${l10n.t('complete')}',
                                    style: TextStyle(
                                        fontSize: 11,
                                        color: isDark
                                            ? Colors.grey[400]
                                            : Colors.grey[500],
                                        fontWeight: FontWeight.w500)),
                              Text(
                                  '$chapterCount ${l10n.isAr ? (isDocument ? 'فصل' : 'درس') : (isDocument ? 'Chapters' : 'Lessons')}',
                                  style: TextStyle(
                                      fontSize: 11,
                                      color: isDark
                                          ? Colors.grey[400]
                                          : Colors.grey[500],
                                      fontWeight: FontWeight.w500)),
                            ],
                          ),
                        ],
                      )
                    ],
                  ),
                ),
              ),

              // Footer Action
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  border: Border(
                      top: BorderSide(
                          color: isDark
                              ? const Color(0xFF2A2A2A)
                              : const Color(0xFFF3F4F6))),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                        isDocument
                            ? (l10n.isAr ? 'قراءة كتاب المشروع' : 'Read Project Book')
                            : l10n.t('continue'),
                        style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary)),
                    CircleAvatar(
                      radius: 12,
                      backgroundColor: AppColors.primary.withAlpha(20),
                      child: Icon(
                          isDocument ? Icons.menu_book : Icons.play_arrow,
                          size: 14,
                          color: AppColors.primary),
                    )
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _placeholder() {
    return Container(
      color: AppColors.primary.withAlpha(20),
      child: const Center(
        child: Icon(Icons.image_not_supported_outlined,
            size: 40, color: Colors.grey),
      ),
    );
  }

  int _calculateProgress(Course c) {
    if (c.lessons.isEmpty) return 0;
    return 0;
  }

  String _courseTypeLabel(String? type, AppLocalizations l10n) {
    final normalized = (type ?? '').toLowerCase();
    if (normalized.contains('video')) return l10n.t('video');
    if (normalized.contains('audio')) return l10n.t('audio_type');
    if (normalized.contains('image') || normalized.contains('theory')) {
      return l10n.t('theory');
    }
    return l10n.t('interactive_course');
  }
}

class _Badge extends StatelessWidget {
  final String text;
  final Color color;
  final Color textColor;

  const _Badge(
      {required this.text, required this.color, required this.textColor});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(6),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 4, sigmaY: 4),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: color.withAlpha(200), // Glassy
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(text.toUpperCase(),
              style: TextStyle(
                color: textColor,
                fontSize: 9,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.5,
              )),
        ),
      ),
    );
  }
}

// ─── Gradient Header ─────────────────────────────────────────────────────────

class NvGradientHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? trailing;

  const NvGradientHeader(
      {super.key, required this.title, this.subtitle, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 60, 20, 32),
      // No background here, just text gradient usually, but preserving container logic
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: ShaderMask(
                shaderCallback: (bounds) => const LinearGradient(
                  colors: [AppColors.gradientStart, AppColors.gradientEnd],
                ).createShader(bounds),
                child: Text(title,
                    style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        color: Colors.white, // Required for shader
                        fontFamily: 'PlusJakartaSans')),
              ),
            ),
            if (trailing != null) trailing!,
          ],
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 6),
          Text(subtitle!,
              style: TextStyle(
                  fontSize: 14,
                  color:
                      Theme.of(context).colorScheme.onSurface.withAlpha(150))),
        ],
      ]),
    );
  }
}

// ─── Loading Overlay ─────────────────────────────────────────────────────────

class NvLoading extends StatelessWidget {
  final String? message;
  const NvLoading({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(
            width: 42,
            height: 42,
            child: CircularProgressIndicator(
              color: AppColors.primary,
              strokeWidth: 3,
            ),
          ),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(message!, style: const TextStyle(fontSize: 14)),
          ],
        ],
      ),
    );
  }
}

// ─── Empty State ─────────────────────────────────────────────────────────────

class NvEmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? action;

  const NvEmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.primary.withAlpha(20),
              shape: BoxShape.circle,
            ),
            child:
                Icon(icon, size: 40, color: AppColors.primary.withAlpha(180)),
          ),
          const SizedBox(height: 20),
          Text(title,
              textAlign: TextAlign.center,
              style:
                  const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          if (subtitle != null) ...[
            const SizedBox(height: 8),
            Text(subtitle!,
                textAlign: TextAlign.center,
                style: TextStyle(
                    fontSize: 14,
                    color: Theme.of(context)
                        .colorScheme
                        .onSurface
                        .withAlpha(128))),
          ],
          if (action != null) ...[const SizedBox(height: 24), action!],
        ]),
      ),
    );
  }
}

// ─── Plan Badge ─────────────────────────────────────────────────────────────────

class NvBadge extends StatelessWidget {
  final String label;
  final Color? color;

  const NvBadge({super.key, required this.label, this.color});

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppColors.primary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: c.withAlpha(30),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: c.withAlpha(80)),
      ),
      child: Text(label,
          style:
              TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: c)),
    );
  }
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

class NvStatCard extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;
  final Color color;

  const NvStatCard({
    super.key,
    required this.value,
    required this.label,
    required this.icon,
    this.color = AppColors.primary,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withAlpha(18),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withAlpha(40)),
      ),
      child: Row(children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: color.withAlpha(35),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 12),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(value,
              style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: color,
                  fontFamily: 'PlusJakartaSans')),
          Text(label,
              style: TextStyle(fontSize: 11, color: color.withAlpha(180))),
        ]),
      ]),
    );
  }
}

// ─── Snackbar helper ─────────────────────────────────────────────────────────

void showSnack(BuildContext context, String msg, {bool error = false}) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Row(children: [
        Icon(error ? Icons.error_outline : Icons.check_circle_outline,
            color: Colors.white, size: 18),
        const SizedBox(width: 8),
        Expanded(child: Text(msg)),
      ]),
      backgroundColor: error ? AppColors.error : const Color(0xFF1DB954),
      behavior: SnackBarBehavior.floating,
      margin: const EdgeInsets.all(16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ),
  );
}

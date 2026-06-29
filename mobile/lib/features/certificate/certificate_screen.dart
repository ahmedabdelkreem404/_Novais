import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'dart:io';

import '../../core/api/endpoints.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/l10n/app_localizations.dart';

import '../../models/course.dart';
import '../../widgets/widgets.dart';

class CertificateScreen extends ConsumerStatefulWidget {
  final int courseId;
  const CertificateScreen({super.key, required this.courseId});
  @override
  ConsumerState<CertificateScreen> createState() => _CertificateScreenState();
}

class _CertificateScreenState extends ConsumerState<CertificateScreen> {
  Course? _course;
  bool _loading = true;
  final _boundary = GlobalKey();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.dio.get(ApiEndpoints.course(widget.courseId));
      setState(() {
        _course = Course.fromJson(res.data);
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _share() async {
    try {
      final boundary =
          _boundary.currentContext!.findRenderObject() as RenderRepaintBoundary;
      final image = await boundary.toImage(pixelRatio: 3);
      final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
      final data = bytes!.buffer.asUint8List();
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/certificate.png');
      await file.writeAsBytes(data);
      await Share.shareXFiles([XFile(file.path)],
          text: 'My NOVAIS Certificate!');
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final user = ref.watch(authProvider).user;
    if (_loading) {
      return const Scaffold(body: NvLoading());
    }
    if (_course == null) {
      return Scaffold(
          appBar: AppBar(),
          body: const NvEmptyState(
              icon: Icons.error_outline, title: 'Not found'));
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.t('certificate')),
        actions: [
          IconButton(
              icon: const Icon(Icons.share),
              tooltip: 'Share',
              onPressed: _share),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(children: [
          RepaintBoundary(
            key: _boundary,
            child: _CertificateCard(
                userName: user?.name ?? '', courseName: _course!.title),
          ),
          const SizedBox(height: 24),
          NvButton(
              label: l10n.t('share'),
              icon: const Icon(Icons.share, size: 16),
              onTap: _share),
          const SizedBox(height: 12),
          NvButton(
              label: 'Back to Course',
              primary: false,
              onTap: () => context.pop()),
        ]),
      ),
    );
  }
}

class _CertificateCard extends StatelessWidget {
  final String userName;
  final String courseName;
  const _CertificateCard({required this.userName, required this.courseName});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF020617), Color(0xFF0f172a)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primary.withAlpha(25), width: 1.5),
        boxShadow: [
          BoxShadow(color: AppColors.primary.withAlpha(25), blurRadius: 40)
        ],
      ),
      child: Column(children: [
        // Header stars
        const Icon(Icons.auto_awesome, color: AppColors.gradientEnd, size: 40),
        const SizedBox(height: 20),
        const Text('CERTIFICATE OF COMPLETION',
            textAlign: TextAlign.center,
            style: TextStyle(
                color: Colors.white60,
                fontSize: 11,
                letterSpacing: 2.5,
                fontWeight: FontWeight.w600)),
        const SizedBox(height: 24),
        const Text('This is to certify that',
            style: TextStyle(color: Colors.white54, fontSize: 13)),
        const SizedBox(height: 12),
        Text(userName,
            textAlign: TextAlign.center,
            style: const TextStyle(
                color: Colors.white,
                fontSize: 28,
                fontWeight: FontWeight.w700,
                fontFamily: 'PlusJakartaSans')),
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Container(height: 1, color: AppColors.primary.withAlpha(25)),
        ),
        const Text('has successfully completed',
            style: TextStyle(color: Colors.white54, fontSize: 13)),
        const SizedBox(height: 12),
        Text(courseName,
            textAlign: TextAlign.center,
            style: const TextStyle(
                color: AppColors.gradientEnd,
                fontSize: 20,
                fontWeight: FontWeight.w700,
                fontFamily: 'PlusJakartaSans')),
        const SizedBox(height: 24),
        // Logo + brand
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                  colors: [AppColors.gradientStart, AppColors.gradientEnd]),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.school, color: Colors.white, size: 16),
          ),
          const SizedBox(width: 8),
          const Text('NOVAIS',
              style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontFamily: 'PlusJakartaSans',
                  fontSize: 18)),
        ]),
      ]),
    );
  }
}

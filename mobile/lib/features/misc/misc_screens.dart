import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/l10n/app_localizations.dart';
import '../../core/theme/app_theme.dart'; // Ensure AppColors/Theme are available
import '../../widgets/widgets.dart';

// ── Policy Screen (Terms / Privacy / Billing / Refund via WebView) ─────────────

class PolicyScreen extends ConsumerStatefulWidget {
  final String slug; // 'terms' | 'privacy' | 'billing' | 'refund' | 'cancel'
  const PolicyScreen({super.key, required this.slug});
  @override
  ConsumerState<PolicyScreen> createState() => _PolicyScreenState();
}

class _PolicyScreenState extends ConsumerState<PolicyScreen> {
  late final WebViewController _wvc;
  bool _pageLoading = true;

  static const _slugUrls = {
    'terms': 'https://novais.app/terms',
    'privacy': 'https://novais.app/privacy',
    'billing': 'https://novais.app/billing-policy',
    'refund': 'https://novais.app/cancel-policy',
    'cancel': 'https://novais.app/cancel-policy',
  };

  static const _titles = {
    'terms': 'Terms of Service',
    'privacy': 'Privacy Policy',
    'billing': 'Billing Policy',
    'refund': 'Refund Policy',
    'cancel': 'Cancellation Policy',
  };

  @override
  void initState() {
    super.initState();
    final url = _slugUrls[widget.slug] ?? 'https://novais.app';
    _wvc = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onPageFinished: (_) => setState(() => _pageLoading = false),
      ))
      ..loadRequest(Uri.parse(url));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[widget.slug] ?? 'Policy'),
        leading: BackButton(onPressed: () => context.pop()),
      ),
      body: Stack(children: [
        WebViewWidget(controller: _wvc),
        if (_pageLoading) const NvLoading(),
      ]),
    );
  }
}

// ── Error / Not Found ─────────────────────────────────────────────────────────

class ErrorScreen extends StatelessWidget {
  final String? message;
  const ErrorScreen({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Scaffold(
      body: NvEmptyState(
        icon: Icons.error_outline,
        title: l10n.t('error_title'),
        subtitle: message ?? l10n.t('error_subtitle'),
        action: NvButton(
          label: l10n.t('go_back'),
          width: 160,
          onTap: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/dashboard');
            }
          },
        ),
      ),
    );
  }
}

// ── Download / Desktop redirect ──────────────────────────────────────────────

class DownloadScreen extends StatelessWidget {
  const DownloadScreen({super.key});

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      // Handle error quietly or show simple snackbar if context available
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(title: const Text('Download Desktop App')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const SizedBox(height: 20),
            Container(
              width: 80, height: 80,
              decoration: BoxDecoration(
                color: Colors.blue.shade600,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(color: Colors.blue.withAlpha(50), blurRadius: 20, offset: const Offset(0, 10))
                ],
              ),
              child: const Icon(Icons.monitor, color: Colors.white, size: 40),
            ),
            const SizedBox(height: 24),
            const Text(
              'NOVAIS for Desktop',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, fontFamily: 'PlusJakartaSans'),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'Experience NOVAIS natively on your operating system. Faster, smoother, and more integrated workflow.',
              style: TextStyle(fontSize: 16, color: isDark ? Colors.grey[400] : Colors.grey[600], height: 1.5),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 48),

            // Windows Card
            _DownloadCard(
              title: 'Windows',
              version: 'v1.0.0 (64-bit)',
              icon: Icons.window,
              color: Colors.blue,
              isDark: isDark,
              onTap: () => _launchUrl('https://novais.app/downloads/NOVAIS-Setup.exe'),
            ),
            const SizedBox(height: 16),

            // macOS Card
            _DownloadCard(
              title: 'macOS',
              version: 'v1.0.0 (Universal)',
              icon: Icons.apple,
              color: isDark ? Colors.white : Colors.black,
              isDark: isDark,
              onTap: () => _launchUrl('https://novais.app/downloads/NOVAIS-Installer.dmg'),
            ),

            const SizedBox(height: 40),
            Text(
              'System Requirements: Windows 10/11 or macOS 12+ (Ventura).\nInternet connection required for AI features.',
              style: TextStyle(fontSize: 13, color: Colors.grey[500], height: 1.4),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _DownloadCard extends StatelessWidget {
  final String title;
  final String version;
  final IconData icon;
  final Color color;
  final bool isDark;
  final VoidCallback onTap;

  const _DownloadCard({
    required this.title,
    required this.version,
    required this.icon,
    required this.color,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1F1F1F) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(isDark ? 50 : 10),
            blurRadius: 10, offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withAlpha(20),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(version, style: TextStyle(fontSize: 14, color: Colors.grey[500])),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: onTap,
              icon: const Icon(Icons.download, size: 18),
              label: Text('Download for $title'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                elevation: 0,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

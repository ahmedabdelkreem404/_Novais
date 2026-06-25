import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/api/endpoints.dart';
import '../../core/theme/app_theme.dart';
import '../../core/l10n/app_localizations.dart';
import '../../models/user.dart';
import '../../widgets/widgets.dart';

// ── Plans loader ──────────────────────────────────────────────────────────────

final _plansProvider = FutureProvider<List<Plan>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final res = await api.dio.get(ApiEndpoints.plans);
  final data = res.data as List? ?? [];
  return data.map((e) => Plan.fromJson(e)).toList();
});

// ── Pricing Screen ────────────────────────────────────────────────────────────

class PricingScreen extends ConsumerStatefulWidget {
  const PricingScreen({super.key});
  @override
  ConsumerState<PricingScreen> createState() => _PricingScreenState();
}

class _PricingScreenState extends ConsumerState<PricingScreen> {
  String _billing = 'monthly';

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final plansAsync = ref.watch(_plansProvider);
    final lang = l10n.locale.languageCode;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.t('pricing'))),
      body: plansAsync.when(
        loading: () => const NvLoading(),
        error: (_, __) => const NvEmptyState(icon: Icons.error_outline, title: 'Failed to load plans'),
        data: (plans) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(children: [
            // Toggle
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Theme.of(context).dividerColor),
              ),
              child: Row(children: [
                _billingBtn(l10n.t('monthly'), 'monthly'),
                _billingBtn(l10n.t('yearly'), 'yearly'),
              ]),
            ),
            const SizedBox(height: 20),
            ...plans.map((plan) => _PlanCard(
              plan: plan, billing: _billing, lang: lang,
              onSelect: () => context.push('/payment', extra: {
                'plan_id': '${plan.slug}_$_billing',
              }),
            )),
          ]),
        ),
      ),
    );
  }

  Widget _billingBtn(String label, String value) {
    final selected = _billing == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _billing = value),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: selected ? AppColors.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13, fontWeight: FontWeight.w600,
                color: selected ? Colors.white : Theme.of(context).colorScheme.onSurface.withAlpha(25),
              )),
        ),
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  final Plan plan;
  final String billing;
  final String lang;
  final VoidCallback onSelect;

  const _PlanCard({required this.plan, required this.billing, required this.lang, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    final isPopular = plan.isPopular;
    final price = billing == 'yearly' && plan.priceEgp != null
        ? (plan.priceEgp! * 10).toStringAsFixed(0)
        : (plan.priceEgp ?? 0).toStringAsFixed(0);
    final features = plan.getFeatures(lang);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isPopular ? AppColors.primary : Theme.of(context).dividerColor,
          width: isPopular ? 2 : 1,
        ),
        gradient: isPopular
            ? LinearGradient(
                colors: [AppColors.primary.withAlpha(10), AppColors.gradientEnd.withAlpha(10)],
                begin: Alignment.topLeft, end: Alignment.bottomRight)
            : null,
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if (isPopular)
            Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [AppColors.gradientStart, AppColors.gradientEnd]),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text('Best Seller', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
            ),
          Text(plan.getName(lang),
              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontFamily: 'PlusJakartaSans')),
          const SizedBox(height: 6),
          Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text(price, style: TextStyle(
                fontSize: 36, fontWeight: FontWeight.w800,
                color: isPopular ? AppColors.primary : null,
                fontFamily: 'PlusJakartaSans')),
            const SizedBox(width: 4),
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Text('EGP / ${billing == 'monthly' ? 'mo' : 'yr'}',
                  style: TextStyle(fontSize: 13, color: Theme.of(context).colorScheme.onSurface.withAlpha(128))),
            ),
          ]),
          const SizedBox(height: 16),
          ...features.map((f) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(children: [
              const Icon(Icons.check_circle, color: AppColors.success, size: 18),
              const SizedBox(width: 8),
              Expanded(child: Text(f, style: const TextStyle(fontSize: 13))),
            ]),
          )),
          const SizedBox(height: 20),
          if (plan.priceEgp != null && plan.priceEgp! > 0)
            NvButton(label: 'Subscribe', onTap: onSelect)
          else
            NvButton(label: 'Current Plan', primary: false, onTap: () {}),
        ]),
      ),
    );
  }
}

// ── Payment WebView Screen ────────────────────────────────────────────────────

class PaymentScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> planData;
  const PaymentScreen({super.key, required this.planData});
  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen> {
  WebViewController? _wvc;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initWebView();
  }

  Future<void> _initWebView() async {
    final api = ref.read(apiClientProvider);
    try {
      final res = await api.dio.post(ApiEndpoints.paymentCheckout, data: widget.planData);
      if (!mounted) return;
      final url = res.data['checkout_url'] ?? res.data['url'] ?? '';
      if (url is! String || url.isEmpty) {
        setState(() {
          _error = 'Payment provider did not return a checkout URL.';
          _loading = false;
        });
        return;
      }

      final controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setNavigationDelegate(NavigationDelegate(
          onNavigationRequest: (req) {
            if (req.url.contains('payment-success') || req.url.contains('successful')) {
              context.go('/payment-success');
              return NavigationDecision.prevent;
            }
            if (req.url.contains('payment-failed') || req.url.contains('cancel')) {
              context.go('/payment-failed');
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
          onPageFinished: (_) {
            if (mounted) setState(() => _loading = false);
          },
        ))
        ..loadRequest(Uri.parse(url));
      if (mounted) {
        setState(() {
          _wvc = controller;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Failed to start payment.';
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment'),
        leading: BackButton(onPressed: () => context.pop()),
      ),
      body: _error != null
          ? NvEmptyState(icon: Icons.error_outline, title: _error!)
          : Stack(
              children: [
                if (_wvc != null) WebViewWidget(controller: _wvc!),
                if (_loading) const NvLoading(message: 'Loading payment...'),
              ],
            ),
    );
  }
}

// ── Payment Result ────────────────────────────────────────────────────────────

class PaymentResultScreen extends ConsumerWidget {
  final bool success;
  const PaymentResultScreen({super.key, required this.success});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(
              width: 100, height: 100,
              decoration: BoxDecoration(
                color: (success ? AppColors.success : AppColors.error).withAlpha(25),
                shape: BoxShape.circle,
              ),
              child: Icon(success ? Icons.check_circle : Icons.cancel,
                  size: 56, color: success ? AppColors.success : AppColors.error),
            ),
            const SizedBox(height: 24),
            Text(success ? l10n.t('payment_success') : l10n.t('payment_failed'),
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontFamily: 'PlusJakartaSans', fontWeight: FontWeight.w700)),
            const SizedBox(height: 32),
            NvButton(
              label: l10n.t('go_dashboard'),
              onTap: () => context.go('/dashboard'),
            ),
          ]),
        ),
      ),
    );
  }
}

// ── Manage Subscription ───────────────────────────────────────────────────────

class ManageSubscriptionScreen extends ConsumerStatefulWidget {
  const ManageSubscriptionScreen({super.key});
  @override
  ConsumerState<ManageSubscriptionScreen> createState() => _ManageSubscriptionScreenState();
}

class _ManageSubscriptionScreenState extends ConsumerState<ManageSubscriptionScreen> {
  bool _cancelling = false;

  Future<void> _cancel() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        title: const Text('Cancel Subscription'),
        content: const Text('Are you sure? You\'ll lose access to Pro features at the end of your billing period.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogCtx, false), child: const Text('Keep')),
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx, true),
            child: const Text('Cancel', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      setState(() => _cancelling = true);
      try {
        final api = ref.read(apiClientProvider);
        await api.dio.post(ApiEndpoints.cancelSubscription);
        if (mounted) showSnack(context, 'Subscription cancelled');
      } catch (_) {
        if (mounted) showSnack(context, 'Failed to cancel', error: true);
      }
      if (mounted) setState(() => _cancelling = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final user = ref.watch(authProvider).user;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.t('manage_subscription'))),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(l10n.t('current_plan'),
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.lightMuted)),
                const SizedBox(height: 6),
                Text(user?.subscriptionType?.toUpperCase() ?? 'Free',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontFamily: 'PlusJakartaSans', fontWeight: FontWeight.w700,
                        color: AppColors.primary)),
              ]),
            ),
          ),
          const SizedBox(height: 16),
          NvButton(label: l10n.t('upgrade'), onTap: () => context.push('/pricing')),
          const SizedBox(height: 12),
          if (user?.subscriptionType != null && user!.subscriptionType != 'free')
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.error,
                  side: const BorderSide(color: AppColors.error),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: _cancelling ? null : _cancel,
                child: _cancelling
                    ? const SizedBox(width: 20, height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.error))
                    : Text(l10n.t('cancel_subscription')),
              ),
            ),
        ]),
      ),
    );
  }
}

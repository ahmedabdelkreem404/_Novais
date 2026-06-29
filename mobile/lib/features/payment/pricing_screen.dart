import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../core/api/endpoints.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/l10n/app_localizations.dart';
import '../../core/theme/app_theme.dart';
import '../../models/user.dart';
import '../../widgets/widgets.dart';

final _plansProvider = FutureProvider<List<Plan>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final res = await api.dio.get(ApiEndpoints.plans);
  final data = res.data as List? ?? [];
  return data.map((e) => Plan.fromJson(e)).toList();
});

final _offlineInstructionsProvider =
    FutureProvider<Map<String, OfflinePaymentMethod>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final res = await api.dio.get(ApiEndpoints.offlinePaymentInstructions);
  final methods = res.data['methods'] as Map? ?? {};
  return methods.map(
    (key, value) => MapEntry(
      key.toString(),
      OfflinePaymentMethod.fromJson((value as Map).cast<String, dynamic>()),
    ),
  );
});

final _offlineRequestsProvider =
    FutureProvider<List<OfflinePaymentRequest>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final res = await api.dio.get(ApiEndpoints.offlinePayments);
  final data = res.data['data'] as List? ?? [];
  return data
      .map((e) => OfflinePaymentRequest.fromJson((e as Map).cast<String, dynamic>()))
      .toList();
});

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
        error: (e, _) => NvEmptyState(
          icon: Icons.error_outline,
          title: l10n.t('error'),
          subtitle: e.toString(),
        ),
        data: (plans) => SafeArea(
          child: RefreshIndicator(
            onRefresh: () async => ref.invalidate(_plansProvider),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _BillingToggle(
                  value: _billing,
                  onChanged: (value) => setState(() => _billing = value),
                ),
                const SizedBox(height: 20),
                ...plans.map((plan) => _PlanCard(
                      plan: plan,
                      billing: _billing,
                      lang: lang,
                      onSelect: () => context.push('/payment', extra: {
                        'plan_id': plan.id,
                        'plan_slug': plan.slug,
                        'plan_name': plan.getName(lang),
                        'billing_cycle': _billing,
                        'amount': _amountFor(plan, _billing),
                      }),
                    )),
              ],
            ),
          ),
        ),
      ),
    );
  }

  double _amountFor(Plan plan, String billing) {
    final monthly = plan.priceEgp ?? 0;
    return billing == 'yearly' ? monthly * 10 : monthly;
  }
}

class _BillingToggle extends StatelessWidget {
  final String value;
  final ValueChanged<String> onChanged;

  const _BillingToggle({required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Row(
        children: [
          _button(context, l10n.t('monthly'), 'monthly'),
          _button(context, l10n.t('yearly'), 'yearly'),
        ],
      ),
    );
  }

  Widget _button(BuildContext context, String label, String itemValue) {
    final selected = value == itemValue;
    return Expanded(
      child: InkWell(
        onTap: () => onChanged(itemValue),
        borderRadius: BorderRadius.circular(10),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 11),
          decoration: BoxDecoration(
            color: selected ? AppColors.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: selected
                  ? Colors.white
                  : Theme.of(context).colorScheme.onSurface.withAlpha(150),
            ),
          ),
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

  const _PlanCard({
    required this.plan,
    required this.billing,
    required this.lang,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final price = billing == 'yearly' && plan.priceEgp != null
        ? (plan.priceEgp! * 10).toStringAsFixed(0)
        : (plan.priceEgp ?? 0).toStringAsFixed(0);
    final features = plan.getFeatures(lang);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: plan.isPopular ? AppColors.primary : Theme.of(context).dividerColor,
          width: plan.isPopular ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (plan.isPopular)
            const NvBadge(label: 'Best Seller', color: AppColors.primary),
          if (plan.isPopular) const SizedBox(height: 10),
          Text(
            plan.getName(lang),
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                price,
                style: const TextStyle(
                  fontSize: 34,
                  fontWeight: FontWeight.w900,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(width: 6),
              Padding(
                padding: const EdgeInsets.only(bottom: 7),
                child: Text('${l10n.t('egp')} / ${l10n.t(billing)}'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...features.map((feature) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.check_circle,
                        color: AppColors.success, size: 18),
                    const SizedBox(width: 8),
                    Expanded(child: Text(feature)),
                  ],
                ),
              )),
          const SizedBox(height: 18),
          if ((plan.priceEgp ?? 0) > 0)
            NvButton(label: l10n.t('subscribe'), onTap: onSelect)
          else
            NvButton(label: l10n.t('current_plan'), primary: false, onTap: () {}),
        ],
      ),
    );
  }
}

class PaymentScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> planData;
  const PaymentScreen({super.key, required this.planData});

  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen> {
  final _phoneCtrl = TextEditingController();
  final _senderNameCtrl = TextEditingController();
  final _senderPhoneCtrl = TextEditingController();
  final _referenceCtrl = TextEditingController();
  final _picker = ImagePicker();

  String _method = 'card';
  XFile? _proof;
  bool _submitting = false;

  bool get _isOffline => _method == 'vodafone_cash' || _method == 'instapay';

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _senderNameCtrl.dispose();
    _senderPhoneCtrl.dispose();
    _referenceCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final instructions = ref.watch(_offlineInstructionsProvider);
    final requests = ref.watch(_offlineRequestsProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.t('payment'))),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(_offlineInstructionsProvider);
            ref.invalidate(_offlineRequestsProvider);
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _CheckoutSummary(planData: widget.planData),
              const SizedBox(height: 18),
              _PaymentMethodGrid(
                selected: _method,
                onChanged: (value) => setState(() => _method = value),
              ),
              const SizedBox(height: 18),
              if (_method == 'wallet') _walletFields(l10n),
              if (_isOffline)
                instructions.when(
                  loading: () => const NvLoading(),
                  error: (e, _) => NvEmptyState(
                    icon: Icons.error_outline,
                    title: l10n.t('payment_unavailable'),
                    subtitle: e.toString(),
                  ),
                  data: (data) => _offlineFields(l10n, data[_method]),
                ),
              const SizedBox(height: 18),
              NvButton(
                label: _isOffline
                    ? l10n.t('submit')
                    : '${l10n.t('payment')} ${_method == 'card' ? l10n.t('card_payment') : l10n.t('wallet_payment')}',
                loading: _submitting,
                onTap: _submitting ? null : _submit,
              ),
              const SizedBox(height: 26),
              requests.when(
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
                data: (items) => _OfflineStatusList(items: items),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _walletFields(AppLocalizations l10n) {
    return NvTextField(
      label: l10n.t('sender_phone'),
      controller: _phoneCtrl,
      keyboardType: TextInputType.phone,
    );
  }

  Widget _offlineFields(AppLocalizations l10n, OfflinePaymentMethod? method) {
    final configured = method?.configured == true;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.primary.withAlpha(20),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.primary.withAlpha(50)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _method == 'vodafone_cash'
                    ? l10n.t('vodafone_cash')
                    : l10n.t('instapay'),
                style: const TextStyle(fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 8),
              Text('${l10n.t('receiver')}: ${method?.receiver ?? '-'}'),
              const SizedBox(height: 8),
              Text(method?.instructions ?? l10n.t('payment_unavailable')),
            ],
          ),
        ),
        if (!configured) ...[
          const SizedBox(height: 12),
          NvEmptyState(
            icon: Icons.block,
            title: l10n.t('payment_unavailable'),
          ),
        ] else ...[
          const SizedBox(height: 14),
          NvTextField(
            label: l10n.t('sender_name'),
            controller: _senderNameCtrl,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 12),
          NvTextField(
            label: l10n.t('sender_phone'),
            controller: _senderPhoneCtrl,
            keyboardType: TextInputType.phone,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 12),
          NvTextField(
            label: l10n.t('transaction_reference'),
            controller: _referenceCtrl,
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _pickProof,
            icon: const Icon(Icons.upload_file),
            label: Text(_proof == null ? l10n.t('upload_proof') : _proof!.name),
          ),
        ],
      ],
    );
  }

  Future<void> _pickProof() async {
    final image = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
      maxWidth: 1600,
    );
    if (image != null && mounted) {
      setState(() => _proof = image);
    }
  }

  Future<void> _submit() async {
    final l10n = context.l10n;
    setState(() => _submitting = true);

    try {
      if (_isOffline) {
        await _submitOffline(l10n);
      } else {
        await _openPaymob();
      }
    } catch (e) {
      if (mounted) {
        final message = _friendlyPaymentError(e, l10n);
        showSnack(context, message, error: true);
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _submitOffline(AppLocalizations l10n) async {
    final reference = _referenceCtrl.text.trim();
    if (reference.isEmpty && _proof == null) {
      showSnack(context, l10n.t('proof_or_reference_required'), error: true);
      return;
    }

    final api = ref.read(apiClientProvider);
    final data = FormData.fromMap({
      'plan_id': widget.planData['plan_id'],
      'billing_cycle': widget.planData['billing_cycle'] ?? 'monthly',
      'method': _method,
      if (_senderNameCtrl.text.trim().isNotEmpty)
        'sender_name': _senderNameCtrl.text.trim(),
      if (_senderPhoneCtrl.text.trim().isNotEmpty)
        'sender_phone': _senderPhoneCtrl.text.trim(),
      if (reference.isNotEmpty) 'transaction_reference': reference,
      if (_proof != null)
        'proof_image': await MultipartFile.fromFile(
          _proof!.path,
          filename: _proof!.name,
        ),
    });

    await api.dio.post(ApiEndpoints.offlinePayments, data: data);
    ref.invalidate(_offlineRequestsProvider);
    if (mounted) {
      showSnack(context, l10n.t('payment_pending'));
      context.go('/payment-success');
    }
  }

  Future<void> _openPaymob() async {
    final api = ref.read(apiClientProvider);
    final checkoutPayload = {
      'plan_id':
          '${widget.planData['plan_slug']}_${widget.planData['billing_cycle']}',
      'payment_method': _method,
      if (_method == 'wallet') 'phone': _phoneCtrl.text.trim(),
    };
    final res =
        await api.dio.post(ApiEndpoints.paymentCheckout, data: checkoutPayload);
    final url = res.data['checkout_url'] ?? res.data['url'] ?? '';
    if (url is! String || url.isEmpty) {
      throw StateError('Payment provider did not return a checkout URL.');
    }
    if (!mounted) return;
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => _PaymentWebView(url: url),
    ));
  }

  String _friendlyPaymentError(Object error, AppLocalizations l10n) {
    if (error is DioException) {
      final data = error.response?.data;
      final message = data is Map ? data['message']?.toString() : null;
      if (message == 'offline_payment.duplicate_pending_request') {
        return l10n.t('duplicate_pending_request');
      }
      if (message == 'offline_payment.proof_or_reference_required') {
        return l10n.t('proof_or_reference_required');
      }
      return message ?? l10n.t('payment_failed');
    }
    return l10n.t('payment_failed');
  }
}

class _CheckoutSummary extends StatelessWidget {
  final Map<String, dynamic> planData;

  const _CheckoutSummary({required this.planData});

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final amount = (planData['amount'] as num?)?.toStringAsFixed(0) ?? '-';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              planData['plan_name']?.toString() ?? l10n.t('pricing'),
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 6),
            Text('${l10n.t(planData['billing_cycle'] ?? 'monthly')} · $amount ${l10n.t('egp')}'),
          ],
        ),
      ),
    );
  }
}

class _PaymentMethodGrid extends StatelessWidget {
  final String selected;
  final ValueChanged<String> onChanged;

  const _PaymentMethodGrid({required this.selected, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final methods = [
      ('card', Icons.credit_card, l10n.t('card_payment')),
      ('wallet', Icons.phone_android, l10n.t('wallet_payment')),
      ('vodafone_cash', Icons.account_balance_wallet, l10n.t('vodafone_cash')),
      ('instapay', Icons.payments_outlined, l10n.t('instapay')),
    ];

    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.45,
      children: methods.map((method) {
        final active = selected == method.$1;
        return InkWell(
          onTap: () => onChanged(method.$1),
          borderRadius: BorderRadius.circular(14),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: active ? AppColors.primary.withAlpha(24) : Theme.of(context).colorScheme.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: active ? AppColors.primary : Theme.of(context).dividerColor,
                width: active ? 2 : 1,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(method.$2, color: active ? AppColors.primary : null),
                const SizedBox(height: 8),
                Text(
                  method.$3,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _OfflineStatusList extends StatelessWidget {
  final List<OfflinePaymentRequest> items;

  const _OfflineStatusList({required this.items});

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();
    final l10n = context.l10n;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(l10n.t('offline_payment'),
            style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 10),
        ...items.take(3).map((item) => Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: ListTile(
                leading: Icon(
                  item.status == 'approved'
                      ? Icons.check_circle
                      : item.status == 'rejected'
                          ? Icons.cancel
                          : Icons.hourglass_top,
                  color: item.status == 'approved'
                      ? AppColors.success
                      : item.status == 'rejected'
                          ? AppColors.error
                          : AppColors.warning,
                ),
                title: Text(item.methodLabel(l10n)),
                subtitle: Text('${item.status} · ${item.amount} ${item.currency}'),
              ),
            )),
      ],
    );
  }
}

class _PaymentWebView extends StatefulWidget {
  final String url;

  const _PaymentWebView({required this.url});

  @override
  State<_PaymentWebView> createState() => _PaymentWebViewState();
}

class _PaymentWebViewState extends State<_PaymentWebView> {
  late final WebViewController _controller;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onNavigationRequest: (req) {
          if (req.url.contains('payment-success') ||
              req.url.contains('successful')) {
            context.go('/payment-success');
            return NavigationDecision.prevent;
          }
          if (req.url.contains('payment-failed') ||
              req.url.contains('cancel')) {
            context.go('/payment-failed');
            return NavigationDecision.prevent;
          }
          return NavigationDecision.navigate;
        },
        onPageFinished: (_) {
          if (mounted) setState(() => _loading = false);
        },
      ))
      ..loadRequest(Uri.parse(widget.url));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.t('payment'))),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_loading) const NvLoading(message: 'Loading payment...'),
        ],
      ),
    );
  }
}

class PaymentResultScreen extends ConsumerWidget {
  final bool success;
  const PaymentResultScreen({super.key, required this.success});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: (success ? AppColors.success : AppColors.error)
                        .withAlpha(25),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    success ? Icons.check_circle : Icons.cancel,
                    size: 56,
                    color: success ? AppColors.success : AppColors.error,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  success ? l10n.t('payment_success') : l10n.t('payment_failed'),
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 32),
                NvButton(
                  label: l10n.t('go_dashboard'),
                  onTap: () => context.go('/dashboard'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class ManageSubscriptionScreen extends ConsumerStatefulWidget {
  const ManageSubscriptionScreen({super.key});

  @override
  ConsumerState<ManageSubscriptionScreen> createState() =>
      _ManageSubscriptionScreenState();
}

class _ManageSubscriptionScreenState
    extends ConsumerState<ManageSubscriptionScreen> {
  bool _cancelling = false;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final user = ref.watch(authProvider).user;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.t('manage_subscription'))),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(l10n.t('current_plan')),
                      const SizedBox(height: 6),
                      Text(
                        user?.subscriptionType?.toUpperCase() ?? 'FREE',
                        style: Theme.of(context)
                            .textTheme
                            .headlineSmall
                            ?.copyWith(color: AppColors.primary),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              NvButton(
                label: l10n.t('upgrade'),
                onTap: () => context.push('/pricing'),
              ),
              const SizedBox(height: 12),
              if (user?.subscriptionType != null &&
                  user!.subscriptionType != 'free')
                OutlinedButton(
                  onPressed: _cancelling ? null : _cancel,
                  child: _cancelling
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text(l10n.t('cancel_subscription')),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _cancel() async {
    setState(() => _cancelling = true);
    try {
      final api = ref.read(apiClientProvider);
      await api.dio.post(ApiEndpoints.cancelSubscription);
      if (mounted) showSnack(context, context.l10n.t('cancel_subscription'));
    } catch (_) {
      if (mounted) showSnack(context, context.l10n.t('error'), error: true);
    } finally {
      if (mounted) setState(() => _cancelling = false);
    }
  }
}

class OfflinePaymentMethod {
  final bool configured;
  final String? receiver;
  final String? instructions;

  const OfflinePaymentMethod({
    required this.configured,
    this.receiver,
    this.instructions,
  });

  factory OfflinePaymentMethod.fromJson(Map<String, dynamic> json) {
    return OfflinePaymentMethod(
      configured: json['configured'] == true,
      receiver: json['receiver']?.toString(),
      instructions: json['instructions']?.toString(),
    );
  }
}

class OfflinePaymentRequest {
  final int id;
  final String method;
  final String status;
  final String currency;
  final num amount;

  const OfflinePaymentRequest({
    required this.id,
    required this.method,
    required this.status,
    required this.currency,
    required this.amount,
  });

  factory OfflinePaymentRequest.fromJson(Map<String, dynamic> json) {
    return OfflinePaymentRequest(
      id: int.tryParse(json['id'].toString()) ?? 0,
      method: json['method']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
      currency: json['currency']?.toString() ?? 'EGP',
      amount: json['amount'] as num? ?? 0,
    );
  }

  String methodLabel(AppLocalizations l10n) {
    if (method == 'vodafone_cash') return l10n.t('vodafone_cash');
    if (method == 'instapay') return l10n.t('instapay');
    return method;
  }
}

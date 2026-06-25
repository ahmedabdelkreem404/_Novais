import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/api/endpoints.dart';
import '../../core/theme/app_theme.dart';
import '../../core/l10n/app_localizations.dart';
import '../../widgets/widgets.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _emailCtrl = TextEditingController();
  bool _loading = false;
  bool _sent = false;

  Future<void> _send() async {
    final email = _emailCtrl.text.trim();
    if (email.isEmpty || !email.contains('@')) return;
    setState(() => _loading = true);
    try {
      final api = ref.read(apiClientProvider);
      await api.dio.post(ApiEndpoints.forgotPassword, data: {'email': email});
      if (mounted) setState(() { _loading = false; _sent = true; });
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        showSnack(context, 'Failed to send reset email', error: true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Scaffold(
      appBar: AppBar(leading: BackButton(onPressed: () => context.pop())),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: _sent
              ? Center(
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    Container(
                      width: 72, height: 72,
                      decoration: BoxDecoration(
                          color: AppColors.success.withAlpha(30),
                          shape: BoxShape.circle),
                      child: const Icon(Icons.mark_email_read_outlined, size: 36, color: AppColors.success),
                    ),
                    const SizedBox(height: 20),
                    Text('Check your inbox!', style: Theme.of(context).textTheme.headlineSmall),
                    const SizedBox(height: 8),
                    Text('We sent a password reset link to ${_emailCtrl.text}',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withAlpha(25))),
                    const SizedBox(height: 32),
                    NvButton(label: l10n.t('sign_in'), onTap: () => context.go('/signin')),
                  ]),
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(l10n.t('forgot_password'),
                        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            fontFamily: 'PlusJakartaSans', fontWeight: FontWeight.w700)),
                    const SizedBox(height: 8),
                    Text('Enter your email address and we\'ll send you a reset link.',
                        style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withAlpha(25))),
                    const SizedBox(height: 32),
                    NvTextField(
                      label: l10n.t('email'), hint: 'you@example.com',
                      controller: _emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                    ),
                    const SizedBox(height: 24),
                    NvButton(label: 'Send Reset Link', onTap: _send, loading: _loading),
                  ],
                ),
        ),
      ),
    );
  }
}

// ── Reset Password ──────────────────────────────────────────────────────────

class ResetPasswordScreen extends ConsumerStatefulWidget {
  final String token;
  const ResetPasswordScreen({super.key, required this.token});
  @override
  ConsumerState<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _obscure = true;
  bool _loading = false;

  Future<void> _reset() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final api = ref.read(apiClientProvider);
      await api.dio.post(ApiEndpoints.resetPassword, data: {
        'token': widget.token,
        'password': _passCtrl.text,
        'password_confirmation': _confirmCtrl.text,
      });
      if (mounted) {
        showSnack(context, 'Password reset successful!');
        context.go('/signin');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        showSnack(context, 'Reset failed. Token may be expired.', error: true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reset Password')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(children: [
            NvTextField(
              label: 'New Password', controller: _passCtrl, obscure: _obscure,
              validator: (v) => (v == null || v.length < 8) ? 'Min 8 chars' : null,
              suffix: IconButton(
                icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                onPressed: () => setState(() => _obscure = !_obscure),
              ),
            ),
            const SizedBox(height: 14),
            NvTextField(
              label: 'Confirm Password', controller: _confirmCtrl, obscure: true,
              validator: (v) => v != _passCtrl.text ? 'Passwords do not match' : null,
            ),
            const SizedBox(height: 24),
            NvButton(label: 'Reset Password', onTap: _reset, loading: _loading),
          ]),
        ),
      ),
    );
  }
}

// ── Verify Email ──────────────────────────────────────────────────────────────

class VerifyEmailScreen extends ConsumerStatefulWidget {
  final String email;
  const VerifyEmailScreen({super.key, required this.email});
  @override
  ConsumerState<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends ConsumerState<VerifyEmailScreen> {
  final _codeCtrl = TextEditingController();
  bool _loading = false;

  Future<void> _verify() async {
    final code = _codeCtrl.text.trim();
    if (code.isEmpty) return;
    setState(() => _loading = true);
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.dio.post(ApiEndpoints.verifyEmail, data: {
        'email': widget.email,
        'code': code,
      });
      final token = res.data['token'] ?? res.data['access_token'];
      if (token != null) {
        final storage = ref.read(storageProvider);
        await storage.write(key: 'jwt_token', value: token.toString());
        await ref.read(authProvider.notifier).refreshUser();
        if (mounted) context.go('/dashboard');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        showSnack(context, 'Invalid or expired code', error: true);
      }
    }
  }

  Future<void> _resend() async {
    try {
      final api = ref.read(apiClientProvider);
      await api.dio.post(ApiEndpoints.resendVerification, data: {'email': widget.email});
      if (mounted) showSnack(context, 'Verification code resent!');
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Scaffold(
      appBar: AppBar(),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(l10n.t('verify_email'),
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontFamily: 'PlusJakartaSans', fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text('${l10n.t('enter_code')} ${widget.email}',
                style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withAlpha(25))),
            const SizedBox(height: 32),
            NvTextField(
              label: 'Verification Code',
              hint: '000000',
              controller: _codeCtrl,
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 24),
            NvButton(label: 'Verify', onTap: _verify, loading: _loading),
            const SizedBox(height: 16),
            Center(
              child: TextButton(
                onPressed: _resend,
                child: Text(l10n.t('resend_code'),
                    style: const TextStyle(color: AppColors.primary)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

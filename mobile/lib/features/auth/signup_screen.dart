import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/widgets.dart';
import '../../widgets/animated_background.dart';

class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({super.key});

  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();

  bool _obscure = true;
  bool _loading = false;

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);
    try {
      final success = await ref.read(authProvider.notifier).register({
        'name': _nameCtrl.text.trim(),
        'email': _emailCtrl.text.trim(),
        'password': _passCtrl.text,
        'password_confirmation': _confirmCtrl.text,
      });

      if (success) {
        if (mounted) {
          // If direct login after register (token returned) -> dashboard
          // If email verify needed -> verify-email screen
          final auth = ref.read(authProvider);
          if (auth.status == AuthStatus.authenticated) {
            context.go('/dashboard');
          } else {
            context.push('/verify-email?email=${_emailCtrl.text.trim()}');
          }
        }
      } else {
        if (mounted) showSnack(context, 'Registration failed', error: true);
      }
    } catch (e) {
      if (mounted) showSnack(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: Stack(
        children: [
          const AppAnimatedBackground(),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                    child: Container(
                      padding: const EdgeInsets.all(32),
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF111827).withAlpha(150)
                            : Colors.white.withAlpha(200),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: isDark
                              ? Colors.white.withAlpha(20)
                              : Colors.black.withAlpha(10),
                        ),
                      ),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Center(
                              child: Column(children: [
                                Image.asset(
                                  'assets/images/logo.png',
                                  width: 72,
                                  height: 72,
                                  fit: BoxFit.contain,
                                ),
                                const SizedBox(height: 20),
                                const Text('NOVAIS',
                                    style: TextStyle(
                                        fontFamily: 'PlusJakartaSans',
                                        fontSize: 28,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: -0.5)),
                                const SizedBox(height: 4),
                                Text('Create your free account',
                                    style: TextStyle(
                                        fontSize: 14,
                                        color: Theme.of(context)
                                            .colorScheme
                                            .onSurface
                                            .withAlpha(128))),
                              ]),
                            ),
                            const SizedBox(height: 36),

                            NvTextField(
                              label: 'Full Name',
                              hint: 'John Doe',
                              controller: _nameCtrl,
                              validator: (v) => (v == null || v.trim().isEmpty)
                                  ? 'Required'
                                  : null,
                            ),
                            const SizedBox(height: 14),
                            NvTextField(
                              label: 'Email Address',
                              hint: 'you@example.com',
                              controller: _emailCtrl,
                              keyboardType: TextInputType.emailAddress,
                              validator: (v) => (v == null || !v.contains('@'))
                                  ? 'Invalid email'
                                  : null,
                            ),
                            const SizedBox(height: 14),
                            NvTextField(
                              label: 'Password',
                              controller: _passCtrl,
                              obscure: _obscure,
                              validator: (v) => (v == null || v.length < 8)
                                  ? 'Min 8 characters'
                                  : null,
                              suffix: IconButton(
                                icon: Icon(_obscure
                                    ? Icons.visibility_off_outlined
                                    : Icons.visibility_outlined),
                                onPressed: () =>
                                    setState(() => _obscure = !_obscure),
                              ),
                            ),
                            const SizedBox(height: 14),
                            NvTextField(
                              label: 'Confirm Password',
                              controller: _confirmCtrl,
                              obscure: true,
                              validator: (v) => v != _passCtrl.text
                                  ? 'Passwords do not match'
                                  : null,
                            ),
                            const SizedBox(height: 24),

                            // Terms note
                            Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 4),
                              child: Text.rich(
                                TextSpan(children: [
                                  TextSpan(
                                      text: 'By signing up, you agree to our ',
                                      style: TextStyle(
                                          fontSize: 12,
                                          color: Theme.of(context)
                                              .colorScheme
                                              .onSurface
                                              .withAlpha(128))),
                                  const TextSpan(
                                      text: 'Terms of Service',
                                      style: TextStyle(
                                          fontSize: 12,
                                          color: AppColors.primary,
                                          fontWeight: FontWeight.w600)),
                                  TextSpan(
                                      text: ' and ',
                                      style: TextStyle(
                                          fontSize: 12,
                                          color: Theme.of(context)
                                              .colorScheme
                                              .onSurface
                                              .withAlpha(128))),
                                  const TextSpan(
                                      text: 'Privacy Policy',
                                      style: TextStyle(
                                          fontSize: 12,
                                          color: AppColors.primary,
                                          fontWeight: FontWeight.w600)),
                                ]),
                              ),
                            ),
                            const SizedBox(height: 24),

                            NvButton(
                                label: 'Create Account',
                                onTap: _register,
                                loading: _loading),
                            const SizedBox(height: 24),

                            Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text('Already have an account?',
                                      style: TextStyle(
                                          color: Theme.of(context)
                                              .colorScheme
                                              .onSurface
                                              .withAlpha(160))),
                                  TextButton(
                                    onPressed: () => context.go('/signin'),
                                    child: const Text('Sign In',
                                        style: TextStyle(
                                            color: AppColors.primary,
                                            fontWeight: FontWeight.w600)),
                                  ),
                                ]),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/theme/app_theme.dart';

import '../../widgets/widgets.dart';
import '../../widgets/animated_background.dart';

class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key});

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _obscure = true;
  bool _loading = false;

  Future<void> _login() async {
    if (_emailCtrl.text.isEmpty || _passCtrl.text.isEmpty) {
      showSnack(context, 'Please fill all fields', error: true);
      return;
    }

    setState(() => _loading = true);
    try {
      final success = await ref.read(authProvider.notifier).login(
        _emailCtrl.text.trim(),
        _passCtrl.text,
      );
      if (success) {
        if (mounted) context.go('/dashboard');
      } else {
        if (mounted) showSnack(context, 'Login failed', error: true);
      }
    } catch (e) {
      if (mounted) showSnack(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _googleLogin() async {
     try {
       await ref.read(authProvider.notifier).loginWithGoogle();
     } catch (e) {
       if (mounted) showSnack(context, 'Google Sign-In not implemented yet', error: true);
     }
  }

  @override
  Widget build(BuildContext context) {
    // context.l10n is an extension, assuming it exists helper or similar.
    // If not, we can use static strings or AppLocalizations.
    // The previous code used context.l10n.t(). I will assume it's valid if imports are correct.
    // Checking extensions.dart might be needed, but I'll stick to standard strings if not sure.
    // To be safe, I will use hardcoded strings for now or standard Localizations if I see the import.
    // The import '../../utils/extensions.dart' suggests it's there.
    
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: Stack(
        children: [
          // Animated Background
          const AppAnimatedBackground(),

          // Content
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: Container(
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF111827).withAlpha(150) // Gray-900/60
                          : Colors.white.withAlpha(200),           // White/80
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: isDark
                            ? Colors.white.withAlpha(20)
                            : Colors.black.withAlpha(10),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withAlpha(isDark ? 50 : 20),
                          blurRadius: 24,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Logo
                        Container(
                          width: 64,
                          height: 64,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1F2937) : Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isDark ? Colors.white.withAlpha(10) : Colors.black.withAlpha(5),
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withAlpha(10),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: const Icon(Icons.auto_awesome, size: 32, color: AppColors.primary),
                          // Using Icon as placeholder if image asset missing
                          // child: Image.asset('assets/images/logo.png', fit: BoxFit.contain),
                        ),
                        const SizedBox(height: 24),
                        
                        const Text(
                          'Welcome Back',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'PlusJakartaSans',
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Continue your learning journey',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: isDark ? Colors.grey[400] : Colors.grey[600],
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 32),

                        // Form
                        NvTextField(
                          controller: _emailCtrl,
                          label: 'Email',
                          prefix: const Icon(Icons.mail_outline, size: 20),
                          hint: 'name@example.com',
                        ),
                        const SizedBox(height: 16),
                        NvTextField(
                          controller: _passCtrl,
                          label: 'Password',
                          prefix: const Icon(Icons.lock_outline, size: 20),
                          hint: '••••••••',
                          suffix: IconButton(
                            icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined, size: 20),
                            onPressed: () => setState(() => _obscure = !_obscure),
                          ),
                          obscure: _obscure,
                        ),
                        
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: () => context.push('/forgot-password'),
                            style: TextButton.styleFrom(
                              foregroundColor: AppColors.primary,
                              textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                            ),
                            child: const Text('Forgot Password?'),
                          ),
                        ),
                        const SizedBox(height: 24),

                        NvButton(
                          label: 'Sign In',
                          onTap: _login,
                          loading: _loading,
                          icon: const Icon(Icons.arrow_forward, size: 18),
                        ),

                        const SizedBox(height: 24),
                        Row(children: [
                          Expanded(child: Divider(color: Theme.of(context).dividerColor)),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Text(
                              'OR',
                              style: TextStyle(
                                color: isDark ? Colors.grey[500] : Colors.grey[400],
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          Expanded(child: Divider(color: Theme.of(context).dividerColor)),
                        ]),
                        const SizedBox(height: 24),

                        _GoogleButton(onTap: _googleLogin),

                        const SizedBox(height: 32),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Don\'t have an account?',
                              style: TextStyle(
                                color: isDark ? Colors.grey[400] : Colors.grey[600],
                              ),
                            ),
                            TextButton(
                              onPressed: () => context.push('/signup'),
                              child: const Text(
                                'Sign Up',
                                style: TextStyle(fontWeight: FontWeight.w700),
                              ),
                            ),
                          ],
                        ),
                      ],
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

class _GoogleButton extends StatelessWidget {
  final VoidCallback onTap;
  const _GoogleButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 14),
          side: BorderSide(color: Theme.of(context).dividerColor, width: 1.0),
          backgroundColor: isDark ? const Color(0xFF1F2937) : Colors.white,
          foregroundColor: isDark ? Colors.white : Colors.black87,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        onPressed: onTap,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
              padding: const EdgeInsets.all(2),
              child: const Icon(Icons.g_mobiledata, color: Colors.blue, size: 24) // Fallback if no SVG
            ),
            const SizedBox(width: 10),
            const Text('Continue with Google',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
          ],
        ),
      ),
    );
  }
}

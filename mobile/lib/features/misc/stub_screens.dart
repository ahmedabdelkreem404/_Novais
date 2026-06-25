// Stub screens for public pages not yet fully implemented.
// These display a simple WebView or placeholder pointing to the live website.
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../widgets/widgets.dart';

class _WebScreen extends StatefulWidget {
  final String url;
  final String title;
  const _WebScreen({required this.url, required this.title});
  @override
  State<_WebScreen> createState() => _WebScreenState();
}

class _WebScreenState extends State<_WebScreen> {
  late final WebViewController _wvc;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _wvc = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onPageFinished: (_) => setState(() => _loading = false),
      ))
      ..loadRequest(Uri.parse(widget.url));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.title),
          leading: BackButton(onPressed: () => Navigator.pop(context))),
      body: Stack(children: [
        WebViewWidget(controller: _wvc),
        if (_loading) const NvLoading(),
      ]),
    );
  }
}

class FeaturesScreen extends StatelessWidget {
  const FeaturesScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const _WebScreen(url: 'https://novais.app/features', title: 'Features');
}

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const _WebScreen(url: 'https://novais.app/about', title: 'About');
}

class ContactScreen extends StatelessWidget {
  const ContactScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const _WebScreen(url: 'https://novais.app/contact', title: 'Contact');
}

class BlogListScreen extends StatelessWidget {
  const BlogListScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const _WebScreen(url: 'https://novais.app/blog', title: 'Blog');
}

class BlogDetailScreen extends StatelessWidget {
  final String slug;
  const BlogDetailScreen({super.key, required this.slug});
  @override
  Widget build(BuildContext context) =>
      _WebScreen(url: 'https://novais.app/blog/$slug', title: 'Blog');
}



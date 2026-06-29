import 'package:flutter_test/flutter_test.dart';
import 'package:novais/core/cache/api_cache.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test('returns cached JSON before ttl expires', () async {
    final cache = await ApiCache.create(userId: '7');

    await cache.writeJson('courses', [
      {'id': 1, 'title': 'Chess Basics'}
    ]);

    expect(await cache.readJson('courses'), [
      {'id': 1, 'title': 'Chess Basics'}
    ]);
  });

  test('expires stale cached JSON', () async {
    final cache = await ApiCache.create(userId: '7');

    await cache.writeJson(
      'profile',
      {'name': 'Ahmed'},
      ttl: Duration.zero,
    );

    expect(await cache.readJson('profile'), isNull);
  });

  test('keeps cache separated by user id and clears one user safely', () async {
    final first = await ApiCache.create(userId: '7');
    final second = await ApiCache.create(userId: '8');

    await first.writeJson('profile', {'name': 'Ahmed'});
    await second.writeJson('profile', {'name': 'Other'});
    await first.clear();

    expect(await first.readJson('profile'), isNull);
    expect(await second.readJson('profile'), {'name': 'Other'});
  });
}

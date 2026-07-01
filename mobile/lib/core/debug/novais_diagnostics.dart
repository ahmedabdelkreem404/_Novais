import 'package:flutter/foundation.dart';

class NovaisDiagnostics {
  static final Stopwatch _startupWatch = Stopwatch()..start();

  static void log(String area, String message) {
    if (!kDebugMode) return;
    debugPrint(
        '[NOVAIS][$area][+${_startupWatch.elapsedMilliseconds}ms] $message');
  }

  static Stopwatch start(String area, String operation) {
    log(area, '$operation started');
    return Stopwatch()..start();
  }

  static void finish(
    String area,
    String operation,
    Stopwatch watch, {
    String? status,
  }) {
    watch.stop();
    final suffix = status == null ? '' : ' status=$status';
    log(area, '$operation finished in ${watch.elapsedMilliseconds}ms$suffix');
  }
}

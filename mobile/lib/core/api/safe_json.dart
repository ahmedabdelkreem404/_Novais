import 'dart:convert';

dynamic decodeNovaisJson(String source) {
  try {
    return jsonDecode(source);
  } on FormatException catch (error) {
    if (!error.message.contains('Invalid unicode escape')) {
      rethrow;
    }
    return jsonDecode(_escapeInvalidUnicodeSequences(source));
  }
}

String _escapeInvalidUnicodeSequences(String source) {
  final buffer = StringBuffer();

  for (var i = 0; i < source.length; i++) {
    final current = source.codeUnitAt(i);
    final hasUnicodePrefix = current == 0x5C &&
        i + 1 < source.length &&
        source.codeUnitAt(i + 1) == 0x75;

    if (!hasUnicodePrefix) {
      buffer.writeCharCode(current);
      continue;
    }

    final hasFourDigits = i + 5 < source.length &&
        _isHex(source.codeUnitAt(i + 2)) &&
        _isHex(source.codeUnitAt(i + 3)) &&
        _isHex(source.codeUnitAt(i + 4)) &&
        _isHex(source.codeUnitAt(i + 5));

    if (hasFourDigits) {
      buffer.writeCharCode(current);
    } else {
      buffer.write(r'\\');
    }
  }

  return buffer.toString();
}

bool _isHex(int codeUnit) {
  return (codeUnit >= 0x30 && codeUnit <= 0x39) ||
      (codeUnit >= 0x41 && codeUnit <= 0x46) ||
      (codeUnit >= 0x61 && codeUnit <= 0x66);
}

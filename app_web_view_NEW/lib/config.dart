// ============================================================
// ⚙️ FILE CẤU HÌNH FLUTTER APP
// ⚠️ Thêm file này vào .gitignore nếu chứa thông tin nhạy cảm
// ============================================================

class AppConfig {
  // ── BASE URLs ──────────────────────────────────────────────
  /// URL backend FastAPI (không có dấu / ở cuối)
  static const String apiBaseUrl = 'https://idiocy-hurled-antler.ngrok-free.dev';

  /// URL frontend web (không có dấu / ở cuối)
  static const String webBaseUrl = 'https://idiocy-hurled-antler.ngrok-free.dev';

  // ── OAUTH DEEP LINK ────────────────────────────────────────
  /// Scheme cho Deep Link callback sau Google OAuth
  /// Phải khớp với android:scheme trong AndroidManifest.xml
  static const String callbackScheme = 'tarottalkapp';

  // ── APP INFO ───────────────────────────────────────────────
  static const String appName = 'Tarot Talk';
  static const String appVersion = '1.0.0';

  // ── COMPUTED ───────────────────────────────────────────────
  /// URL endpoint đăng nhập Google dành cho Flutter
  static String get googleLoginFlutterUrl =>
      '$apiBaseUrl/api/google-login?callback_scheme=$callbackScheme';
}

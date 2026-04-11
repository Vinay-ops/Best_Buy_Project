
class AppConfig {
  /// The base URL for the backend API.
  ///
  /// For production, replace this with your deployed server URL.
  /// For development:
  /// - Use '10.0.2.2' for Android Emulators
  /// - Use your local IP (e.g., '192.168.x.x') for Physical Devices
  static String get apiBaseUrl {
    // Use the updated production Vercel URL
    return 'https://best-buy-project-4t7mmv0zj-vinay-ops-projects.vercel.app';
  }

  // Pass these at build/run time:
  // flutter run --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=...
  static const String supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
  );

  static bool get hasSupabaseConfig {
    return supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;
  }
}

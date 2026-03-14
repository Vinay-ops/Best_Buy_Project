import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../api/backend_service.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();

  factory AuthService() {
    return _instance;
  }

  AuthService._internal();

  // Keys for SharedPreferences
  static const String _loggedInKey = 'logged_in';
  static const String _usernameKey = 'username';
  static const String _sessionCookieKey = 'session_cookie';

  late SharedPreferences _prefs;

  Future<void> initialize() async {
    _prefs = await SharedPreferences.getInstance();
    debugPrint('🔐 AuthService initialized');
  }

  Future<bool> isLoggedIn() async {
    return _prefs.getBool(_loggedInKey) ?? false;
  }

  Future<String?> getUsername() async {
    return _prefs.getString(_usernameKey);
  }

  Future<String?> getSessionCookie() async {
    return _prefs.getString(_sessionCookieKey);
  }

  Future<void> saveLoginState({
    required String username,
    required String sessionCookie,
  }) async {
    await _prefs.setBool(_loggedInKey, true);
    await _prefs.setString(_usernameKey, username);
    await _prefs.setString(_sessionCookieKey, sessionCookie);
    debugPrint('✅ Login state saved - User: $username');
  }

  Future<void> clearLoginState() async {
    await _prefs.remove(_loggedInKey);
    await _prefs.remove(_usernameKey);
    await _prefs.remove(_sessionCookieKey);
    debugPrint('✅ Login state cleared');
  }

  Future<Map<String, dynamic>> restoreSession({
    required BackendService service,
  }) async {
    try {
      final isLogged = await isLoggedIn();
      if (!isLogged) {
        return {'logged_in': false, 'user': null};
      }

      final username = await getUsername();
      debugPrint('🔐 Restored session for user: $username');

      return {
        'logged_in': true,
        'user': {'username': username},
      };
    } catch (e) {
      debugPrint('❌ Session restore error: $e');
      return {'logged_in': false, 'user': null};
    }
  }
}

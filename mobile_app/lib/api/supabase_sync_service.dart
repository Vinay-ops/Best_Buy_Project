import 'package:flutter/foundation.dart';
// Supabase sync disabled - will be re-enabled after resolving build issues
// import 'package:supabase_flutter/supabase_flutter.dart';

// Mock Supabase instance for now
class _MockSupabaseTable {
  Future<void> insert(Map<String, dynamic> data) async {
    // Mock insert - does nothing
  }
}

class _MockSupabaseClient {
  bool get isConnected => false;
  _MockSupabaseTable from(String table) => _MockSupabaseTable();

  // Mock auth for now
  _MockAuth get auth => _MockAuth();
}

class _MockAuth {
  _MockSession? get currentSession => null;
}

class _MockSession {}

class _MockSupabase {
  static final instance = _MockSupabase._();
  _MockSupabase._();
  final client = _MockSupabaseClient();
}

final Supabase = _MockSupabase.instance;

class SupabaseSyncService {
  SupabaseSyncService._();

  static final SupabaseSyncService instance = SupabaseSyncService._();

  bool get isEnabled =>
      Supabase.client.auth.currentSession != null || _hasClient;

  bool get _hasClient {
    try {
      Supabase.client;
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> syncAuthState({
    required String? username,
    required bool loggedIn,
  }) async {
    if (!_hasClient) return;
    try {
      await Supabase.client.from('app_events').insert({
        'event_type': loggedIn ? 'login' : 'logout',
        'username': username,
        'payload': {'logged_in': loggedIn},
      });
    } catch (e) {
      debugPrint('Supabase auth sync skipped: $e');
    }
  }

  Future<void> trackSearch({
    required String query,
    required int resultCount,
    required String? username,
  }) async {
    if (!_hasClient || query.trim().isEmpty) return;
    try {
      await Supabase.client.from('app_events').insert({
        'event_type': 'search',
        'username': username,
        'payload': {'query': query, 'result_count': resultCount},
      });
    } catch (e) {
      debugPrint('Supabase search tracking skipped: $e');
    }
  }

  Future<void> syncCart({
    required List<Map<String, dynamic>> cart,
    required String? username,
  }) async {
    if (!_hasClient || username == null || username.isEmpty) return;

    final total = cart.fold<double>(0, (sum, item) {
      final price = item['price'];
      final qty = item['quantity'];
      final p = price is num
          ? price.toDouble()
          : double.tryParse('$price') ?? 0;
      final q = qty is num ? qty.toInt() : int.tryParse('$qty') ?? 1;
      return sum + (p * q);
    });

    try {
      await Supabase.client.from('cart_snapshots').insert({
        'username': username,
        'items': cart,
        'total_amount': total,
      });
    } catch (e) {
      debugPrint('Supabase cart sync skipped: $e');
    }
  }

  Future<void> savePriceAlert({
    required String title,
    required double targetPrice,
    required String email,
    required String? username,
  }) async {
    if (!_hasClient) return;
    try {
      await Supabase.client.from('price_alerts').insert({
        'username': username,
        'title': title,
        'target_price': targetPrice,
        'email': email,
      });
    } catch (e) {
      debugPrint('Supabase alert save skipped: $e');
    }
  }
}

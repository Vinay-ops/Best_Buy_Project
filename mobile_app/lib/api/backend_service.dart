import 'package:flutter/foundation.dart';

import 'api_client.dart';

class BackendService {
  BackendService({ApiClient? client}) : _client = client ?? ApiClient.instance;

  final ApiClient _client;

  Future<Map<String, dynamic>> authStatus() async {
    final response = await _client.get('/api/auth/status');
    return response.data;
  }

  Future<ApiResponse> login({
    required String username,
    required String password,
  }) {
    return _client.post(
      '/api/login',
      body: {'username': username, 'password': password},
    );
  }

  Future<ApiResponse> register({
    required String username,
    required String password,
  }) {
    return _client.post(
      '/api/register',
      body: {'username': username, 'password': password},
    );
  }

  Future<ApiResponse> logout() {
    return _client.post('/api/logout');
  }

  Future<List<Map<String, dynamic>>> getProducts() async {
    try {
      final response = await _client.get('/api/products');
      debugPrint('📦 Products Response Status: ${response.statusCode}');

      if (!response.ok) {
        debugPrint('❌ Products API Error: ${response.data}');
        return [];
      }

      final products = response.data['products'];
      debugPrint('📦 Products returned: ${_mapList(products).length}');
      return _mapList(products);
    } catch (e) {
      debugPrint('❌ Products Exception: $e');
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> searchProducts(String query) async {
    try {
      final response = await _client.get('/api/search', query: {'q': query});
      debugPrint('🔍 Search Response Status: ${response.statusCode}');
      debugPrint('🔍 Search Response Data: ${response.data}');

      if (!response.ok) {
        debugPrint('❌ Search API Error: ${response.data}');
        return [];
      }

      final products = response.data['products'];
      debugPrint('🔍 Products returned: ${_mapList(products).length}');
      return _mapList(products);
    } catch (e) {
      debugPrint('❌ Search Exception: $e');
      return [];
    }
  }

  Future<ApiResponse> addToCart(
    Map<String, dynamic> product, {
    int quantity = 1,
  }) {
    return _client.post(
      '/api/cart/add',
      body: {
        'id':
            '${product['id'] ?? product['title'] ?? DateTime.now().millisecondsSinceEpoch}',
        'title': product['title'] ?? 'Product',
        'price': _asDouble(product['price']),
        'quantity': quantity,
      },
    );
  }

  Future<Map<String, dynamic>> getCart() async {
    final response = await _client.get('/api/cart');
    return response.data;
  }

  Future<ApiResponse> removeFromCart(String itemId) {
    return _client.post('/api/cart/remove', body: {'id': itemId});
  }

  Future<ApiResponse> clearCart() {
    return _client.post('/api/cart/clear');
  }

  Future<Map<String, dynamic>> optimizeCart() async {
    final response = await _client.get('/api/cart/optimize');
    return response.data;
  }

  Future<ApiResponse> checkout() {
    return _client.post('/api/checkout');
  }

  Future<List<Map<String, dynamic>>> getOrders() async {
    final response = await _client.get('/api/orders');
    return _mapList(response.data['orders']);
  }

  Future<Map<String, dynamic>> getPriceHistory(double price) async {
    final response = await _client.post(
      '/api/price-history',
      body: {'price': price},
    );
    return response.data;
  }

  Future<ApiResponse> setAlert({
    required String title,
    required double targetPrice,
    required String email,
  }) {
    return _client.post(
      '/api/set-alert',
      body: {'title': title, 'target_price': targetPrice, 'email': email},
    );
  }

  Future<String> getAiSummary(String title) async {
    final response = await _client.post(
      '/api/ai-summary',
      body: {'title': title},
    );
    final summary = response.data['summary'];
    return summary is String ? summary : 'No summary available.';
  }

  List<Map<String, dynamic>> _mapList(dynamic value) {
    if (value is! List) {
      return <Map<String, dynamic>>[];
    }

    return value
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }

  double _asDouble(dynamic value) {
    if (value is num) {
      return value.toDouble();
    }

    return double.tryParse('$value') ?? 0;
  }
}

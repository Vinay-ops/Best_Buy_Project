import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../config/app_config.dart';

class ApiClient {
  ApiClient._();

  static final ApiClient instance = ApiClient._();

  final http.Client _client = http.Client();
  String? _cookie;

  Future<ApiResponse> get(String path, {Map<String, String>? query}) async {
    final uri = Uri.parse(
      '${AppConfig.apiBaseUrl}$path',
    ).replace(queryParameters: query);
    final response = await _client.get(uri, headers: _headers());
    _captureCookie(response);
    return _toApiResponse(response);
  }

  Future<ApiResponse> post(String path, {Map<String, dynamic>? body}) async {
    final uri = Uri.parse('${AppConfig.apiBaseUrl}$path');
    final response = await _client.post(
      uri,
      headers: _headers(),
      body: jsonEncode(body ?? <String, dynamic>{}),
    );
    _captureCookie(response);
    return _toApiResponse(response);
  }

  Map<String, String> _headers() {
    final headers = <String, String>{'Content-Type': 'application/json'};

    if (_cookie != null && _cookie!.isNotEmpty) {
      headers['Cookie'] = _cookie!;
    }

    return headers;
  }

  void _captureCookie(http.Response response) {
    final setCookie = response.headers['set-cookie'];
    if (setCookie == null || setCookie.isEmpty) {
      return;
    }

    _cookie = setCookie.split(';').first;
  }

  ApiResponse _toApiResponse(http.Response response) {
    try {
      // If response is empty, return empty JSON
      if (response.body.isEmpty) {
        return ApiResponse(
          statusCode: response.statusCode,
          data: <String, dynamic>{},
        );
      }

      // Try to decode as JSON
      final dynamic payload = jsonDecode(response.body);

      if (payload is Map<String, dynamic>) {
        return ApiResponse(statusCode: response.statusCode, data: payload);
      }

      return ApiResponse(
        statusCode: response.statusCode,
        data: <String, dynamic>{'data': payload},
      );
    } on FormatException catch (e) {
      // Handle non-JSON responses (HTML error pages, plain text, etc.)
      debugPrint('❌ JSON Parse Error: ${e.message}');
      final previewLength = response.body.length > 200
          ? 200
          : response.body.length;
      debugPrint('Response body: ${response.body.substring(0, previewLength)}');

      final rawResponseLength = response.body.length > 500
          ? 500
          : response.body.length;
      return ApiResponse(
        statusCode: response.statusCode,
        data: <String, dynamic>{
          'error':
              'Server returned an invalid response. Status: ${response.statusCode}',
          'raw_response': response.body.substring(0, rawResponseLength),
        },
      );
    } catch (e) {
      debugPrint('❌ Unexpected error parsing response: $e');
      return ApiResponse(
        statusCode: response.statusCode,
        data: <String, dynamic>{'error': 'Failed to parse server response: $e'},
      );
    }
  }
}

class ApiResponse {
  const ApiResponse({required this.statusCode, required this.data});

  final int statusCode;
  final Map<String, dynamic> data;

  bool get ok => statusCode >= 200 && statusCode < 300;
}

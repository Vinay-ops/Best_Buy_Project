import 'package:flutter/material.dart';
import 'api/api_client.dart';
import 'api/backend_service.dart';
import 'animations.dart';
import 'services/auth_service.dart';
import 'screens/splash_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Initialize AuthService for persistent login
  await AuthService().initialize();
  runApp(const BestBuyFinderApp());
}

class BestBuyFinderApp extends StatelessWidget {
  const BestBuyFinderApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BestBuyFinder',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF197EF1)),
        scaffoldBackgroundColor: Colors.white,
        useMaterial3: true,
        fontFamily: 'Inter',
      ),
      home: const SplashScreen(),
      routes: {'/home': (context) => const AppShell()},
    );
  }
}

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  final BackendService _service = BackendService(client: ApiClient.instance);
  final AuthService _authService = AuthService();
  // final SupabaseSyncService _supabaseSync = SupabaseSyncService.instance;
  int _currentIndex = 0;
  bool _loggedIn = false;
  String? _username;
  int _cartCount = 0;

  @override
  void initState() {
    super.initState();
    _restoreSession();
    _refreshCartCount();
  }

  Future<void> _restoreSession() async {
    try {
      // First check if user was previously logged in
      final wasLoggedIn = await _authService.isLoggedIn();
      final restoredUsername = await _authService.getUsername();

      if (wasLoggedIn && restoredUsername != null) {
        setState(() {
          _loggedIn = true;
          _username = restoredUsername;
        });
        debugPrint('✅ Session restored for user: $_username');
        return;
      }

      // If not previously logged in, check current auth status from server
      _refreshSession();
    } catch (e) {
      debugPrint('Session restore error: $e');
      _refreshSession();
    }
  }

  Future<void> _refreshSession() async {
    try {
      debugPrint('🔐 Refreshing session...');
      final wasLoggedIn = _loggedIn;
      final status = await _service.authStatus();
      debugPrint('🔐 Auth status: $status');
      setState(() {
        _loggedIn = status['logged_in'] == true;
        _username = status['user']?['username'];
      });
      debugPrint('🔐 Updated login state: $_loggedIn, username: $_username');

      if (wasLoggedIn != _loggedIn) {
        debugPrint('🔐 Login state changed: $wasLoggedIn → $_loggedIn');
        // await _supabaseSync.syncAuthState(
        //   username: _username,
        //   loggedIn: _loggedIn,
        // );
      }
    } catch (e) {
      debugPrint('❌ Session error: $e');
    }
  }

  Future<void> _refreshCartCount() async {
    try {
      final cartData = await _service.getCart();
      debugPrint('🔄 Refreshing cart count...');
      debugPrint('Cart data: ${cartData['cart']}');
      final cartRaw = cartData['cart'];
      if (cartRaw is List) {
        final cart = cartRaw
            .whereType<Map>()
            .map((item) => Map<String, dynamic>.from(item))
            .toList();
        setState(() {
          _cartCount = cart.fold<int>(
            0,
            (sum, item) => sum + (int.tryParse('${item['quantity']}') ?? 0),
          );
        });
        debugPrint('✅ Cart count updated: $_cartCount items');
        // await _supabaseSync.syncCart(cart: cart, username: _username);
      }
    } catch (e) {
      debugPrint('❌ Cart count error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      HomeScreen(
        service: _service,
        onCartUpdated: _refreshCartCount,
        username: _username,
      ),
      DiscoverScreen(
        service: _service,
        onCartUpdated: _refreshCartCount,
        isSearch: true,
        username: _username,
      ),
      CartScreen(
        service: _service,
        loggedIn: _loggedIn,
        onCartUpdated: _refreshCartCount,
        onNeedsLogin: () => setState(() => _currentIndex = 4),
        key: ValueKey(
          '$_loggedIn-$_cartCount',
        ), // Force rebuild when login OR cart changes
      ),
      OrdersScreen(
        service: _service,
        loggedIn: _loggedIn,
        onNeedsLogin: () => setState(() => _currentIndex = 4),
        key: ValueKey(_loggedIn), // Force rebuild when login status changes
      ),
      ProfileScreen(
        service: _service,
        loggedIn: _loggedIn,
        username: _username,
        onAuthUpdated: () async {
          await _refreshSession();
          await _refreshCartCount();
        },
      ),
    ];

    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: screens),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(color: Colors.grey.shade200, width: 0.5),
          ),
        ),
        child: BottomNavigationBar(
          type: BottomNavigationBarType.fixed,
          currentIndex: _currentIndex,
          selectedItemColor: const Color(0xFF197EF1),
          unselectedItemColor: const Color(0xFF93A3BC),
          selectedFontSize: 11,
          unselectedFontSize: 11,
          elevation: 0,
          onTap: (i) => setState(() => _currentIndex = i),
          items: [
            _navItem(Icons.home_outlined, Icons.home, 'Home'),
            _navItem(Icons.search, Icons.search, 'Search'),
            BottomNavigationBarItem(
              icon: Stack(
                clipBehavior: Clip.none,
                children: [
                  const Icon(Icons.shopping_cart_outlined),
                  if (_cartCount > 0)
                    Positioned(
                      right: -8,
                      top: -8,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Color(0xFF197EF1),
                          shape: BoxShape.circle,
                        ),
                        child: Text(
                          '$_cartCount',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 8,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              label: 'Cart',
            ),
            _navItem(Icons.assignment_outlined, Icons.assignment, 'Orders'),
            _navItem(Icons.person_outline, Icons.person, 'Profile'),
          ],
        ),
      ),
    );
  }

  BottomNavigationBarItem _navItem(
    IconData icon,
    IconData activeIcon,
    String label,
  ) {
    return BottomNavigationBarItem(
      icon: Icon(icon),
      activeIcon: Icon(activeIcon),
      label: label,
    );
  }
}

// --- Discover Screen ---
class DiscoverScreen extends StatefulWidget {
  final BackendService service;
  final VoidCallback onCartUpdated;
  final bool isSearch;
  final String? username;

  const DiscoverScreen({
    super.key,
    required this.service,
    required this.onCartUpdated,
    this.isSearch = false,
    this.username,
  });

  @override
  State<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends State<DiscoverScreen> {
  // final SupabaseSyncService _supabaseSync = SupabaseSyncService.instance;
  final TextEditingController _searchCtrl = TextEditingController();
  List<Map<String, dynamic>> _allProducts = [];
  List<Map<String, dynamic>> _products = [];
  bool _loading = true;
  String _selectedCategory = 'All';

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() => _loading = true);
    try {
      debugPrint('📦 Fetching featured products...');
      final res = await widget.service.getProducts();
      debugPrint('📦 Fetched ${res.length} featured products');
      setState(() {
        _allProducts = res;
        _products = res;
      });
    } catch (e) {
      debugPrint('❌ Fetch error: $e');
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed to load products: $e')));
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _performSearch() async {
    final query = _searchCtrl.text.trim();
    if (query.isEmpty) {
      _applyFilters();
      return;
    }

    setState(() => _loading = true);
    try {
      debugPrint('🔍 Performing search for: $query');
      final res = await widget.service.searchProducts(query);
      debugPrint('📊 Search returned ${res.length} products');
      setState(() {
        _allProducts = res;
      });
      _applyFilters();
      if (res.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No products found. Try different search.'),
          ),
        );
      }
    } catch (e) {
      debugPrint('❌ Search error: $e');
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Search error: $e')));
    } finally {
      setState(() => _loading = false);
    }
  }

  void _applyFilters() {
    final query = _searchCtrl.text.trim().toLowerCase();
    final source = _normalizeSource(_selectedCategory);

    final filtered = _allProducts.where((product) {
      final title = '${product['title'] ?? product['name'] ?? ''}'
          .toLowerCase();
      final itemSource = _normalizeSource('${product['source'] ?? ''}');

      final queryMatch =
          query.isEmpty || title.contains(query) || itemSource.contains(query);
      final sourceMatch = source == 'all' || itemSource == source;
      return queryMatch && sourceMatch;
    }).toList();

    setState(() => _products = filtered);
  }

  String _normalizeSource(String value) {
    return value
        .toLowerCase()
        .replaceAll('&', 'and')
        .replaceAll("'", '')
        .replaceAll(' ', '');
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        children: [
          _DiscoveryHeader(),
          const SizedBox(height: 20),
          _SearchBar(
            controller: _searchCtrl,
            onChanged: (_) => _applyFilters(),
            onSubmitted: (_) =>
                widget.isSearch ? _performSearch() : _applyFilters(),
          ),
          const SizedBox(height: 10),
          if (widget.isSearch)
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton.icon(
                onPressed: _performSearch,
                icon: const Icon(Icons.search),
                label: const Text('Search Online'),
              ),
            ),
          const SizedBox(height: 20),
          _CategoryFilters(
            selected: _selectedCategory,
            onChanged: (val) {
              setState(() => _selectedCategory = val);
              _applyFilters();
            },
          ),
          const SizedBox(height: 24),
          _BestDealCard(
            product: _bestDeal(),
            onTap: () => _openDetails(_bestDeal()),
          ),
          const SizedBox(height: 32),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Recommended for You',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF061233),
                ),
              ),
              TextButton(
                onPressed: () => setState(() {
                  // Already showing all products
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Already showing all recommended'),
                    ),
                  );
                }),
                child: const Text(
                  'See all',
                  style: TextStyle(color: Color(0xFF197EF1)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _loading
              ? const Center(child: CircularProgressIndicator())
              : GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.72,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                  ),
                  itemCount: _products.length,
                  itemBuilder: (ctx, i) => _DiscoveryProductCard(
                    product: _products[i],
                    onTap: () => _openDetails(_products[i]),
                    onAdd: () async {
                      try {
                        debugPrint(
                          '🛒 Adding to cart: ${_products[i]['title']}',
                        );
                        final response = await widget.service.addToCart(
                          _products[i],
                        );

                        if (response.ok) {
                          debugPrint('✅ Added to cart successfully');
                          widget.onCartUpdated();
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('✓ Added to cart'),
                                duration: Duration(seconds: 1),
                              ),
                            );
                          }
                        } else {
                          debugPrint(
                            '❌ Failed to add to cart: ${response.data}',
                          );
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  'Failed to add: ${response.data['error'] ?? 'Unknown error'}',
                                ),
                                duration: const Duration(seconds: 2),
                              ),
                            );
                          }
                        }
                      } catch (e) {
                        debugPrint('❌ Add to cart exception: $e');
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Error: $e'),
                              duration: const Duration(seconds: 2),
                            ),
                          );
                        }
                      }
                    },
                  ),
                ),
        ],
      ),
    );
  }

  Map<String, dynamic>? _bestDeal() {
    if (_products.isEmpty) return null;
    final sorted = [..._products]
      ..sort((a, b) {
        final pa = double.tryParse('${a['price']}') ?? double.infinity;
        final pb = double.tryParse('${b['price']}') ?? double.infinity;
        return pa.compareTo(pb);
      });
    return sorted.first;
  }

  void _openDetails(Map<String, dynamic>? product) {
    if (product == null) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ProductDetailsScreen(
          product: product,
          service: widget.service,
          onCartUpdated: widget.onCartUpdated,
          username: widget.username,
        ),
      ),
    );
  }
}

// --- Cart Screen ---
class CartScreen extends StatefulWidget {
  final BackendService service;
  final bool loggedIn;
  final VoidCallback onCartUpdated;
  final VoidCallback onNeedsLogin;

  const CartScreen({
    super.key,
    required this.service,
    required this.loggedIn,
    required this.onCartUpdated,
    required this.onNeedsLogin,
  });

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  List<Map<String, dynamic>> _items = [];
  List<Map<String, dynamic>> _suggestions = [];
  bool _loading = true;
  bool _optimizing = false;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  @override
  void didUpdateWidget(CartScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    debugPrint('🔄 CartScreen updated, refreshing...');
    _fetch();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    debugPrint('🔄 CartScreen dependencies changed, refreshing...');
    _fetch();
  }

  Future<void> _fetch() async {
    if (!mounted) return;
    setState(() => _loading = true);
    try {
      debugPrint('📥 Fetching cart data...');
      final res = await widget.service.getCart();
      debugPrint('📥 Full response: $res');
      final cartData = res['cart'];
      debugPrint('📥 Cart data: $cartData');
      debugPrint('📥 Cart data type: ${cartData.runtimeType}');

      if (cartData is List) {
        final items = cartData
            .whereType<Map>()
            .map((item) => Map<String, dynamic>.from(item))
            .toList();
        if (mounted) setState(() => _items = items);
        debugPrint('✅ Cart updated with ${items.length} items');
        for (var item in items) {
          debugPrint(
            '  - ${item['title']}: qty=${item['quantity']}, price=${item['price']}',
          );
        }
      } else {
        if (mounted) setState(() => _items = []);
        debugPrint('⚠️  Cart data is not a list: ${cartData.runtimeType}');
      }
    } catch (e) {
      debugPrint('❌ Cart fetch error: $e');
      if (mounted) setState(() => _items = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _optimizeCart() async {
    setState(() => _optimizing = true);
    try {
      final res = await widget.service.optimizeCart();
      final suggestionsRaw = res['suggestions'];
      if (suggestionsRaw is List) {
        setState(() {
          _suggestions = suggestionsRaw
              .whereType<Map>()
              .map((item) => Map<String, dynamic>.from(item))
              .toList();
        });
      }

      if (!mounted) return;
      showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Cart Optimized'),
          content: Text(
            'Current total: ₹${res['original_total']}\n'
            'Optimized total: ₹${res['new_total']}\n'
            'You save: ₹${res['savings']}',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Nice'),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Optimization failed: $e')));
    } finally {
      setState(() => _optimizing = false);
    }
  }

  Future<void> _startCheckout() async {
    debugPrint('🛒 Starting checkout...');
    debugPrint('🛒 Logged in: ${widget.loggedIn}');

    if (!widget.loggedIn) {
      debugPrint('❌ Not logged in, requesting login');
      widget.onNeedsLogin();
      return;
    }

    debugPrint('✅ User is logged in, proceeding with checkout');

    final upiCtrl = TextEditingController(text: 'test@upi');
    final approved = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('UPI Payment'),
        content: TextField(
          controller: upiCtrl,
          decoration: const InputDecoration(
            labelText: 'UPI ID',
            hintText: 'username@bank',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Pay Now'),
          ),
        ],
      ),
    );

    if (approved != true) return;
    final res = await widget.service.checkout();
    if (!mounted) return;
    if (res.ok) {
      await _fetch();
      widget.onCartUpdated();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Order placed successfully!')),
        );
      }
      return;
    }

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res.data['error'] ?? 'Checkout failed')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text(
          'Shopping Cart',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _items.isEmpty
          ? _EmptyCartState(onStart: () => Navigator.of(context).pop())
          : ListView(
              padding: const EdgeInsets.all(24),
              children: [
                ..._items.map(
                  (item) => _CartListItem(
                    item: item,
                    onRemove: () async {
                      await widget.service.removeFromCart(
                        item['id'].toString(),
                      );
                      _fetch();
                      widget.onCartUpdated();
                    },
                  ),
                ),
                const SizedBox(height: 30),
                _OrderSummary(items: _items),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: _optimizing ? null : _optimizeCart,
                  icon: _optimizing
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.auto_fix_high),
                  label: const Text('Optimize Cart (Find Cheaper)'),
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size.fromHeight(50),
                    backgroundColor: const Color(0xFFF6C344),
                    foregroundColor: const Color(0xFF061233),
                  ),
                ),
                if (_suggestions.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  const Text(
                    'Suggestions',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  ..._suggestions
                      .take(4)
                      .map(
                        (item) => _CartSuggestionTile(
                          item: item,
                          onAdd: () async {
                            try {
                              debugPrint(
                                '🛒 Adding suggestion to cart: ${item['title']}',
                              );
                              final response = await widget.service.addToCart(
                                item,
                              );

                              if (response.ok) {
                                debugPrint('✅ Suggestion added to cart');
                                await _fetch();
                                widget.onCartUpdated();
                                if (mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('✓ Added to cart'),
                                      duration: Duration(seconds: 1),
                                    ),
                                  );
                                }
                              } else {
                                debugPrint(
                                  '❌ Failed to add suggestion: ${response.data}',
                                );
                                if (mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        'Failed: ${response.data['error'] ?? 'Unknown error'}',
                                      ),
                                      duration: const Duration(seconds: 2),
                                    ),
                                  );
                                }
                              }
                            } catch (e) {
                              debugPrint('❌ Add suggestion exception: $e');
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Error: $e'),
                                    duration: const Duration(seconds: 2),
                                  ),
                                );
                              }
                            }
                          },
                        ),
                      ),
                ],
                const SizedBox(height: 16),
                _CheckoutButton(onTap: _startCheckout),
              ],
            ),
    );
  }
}

// --- Orders Screen ---
class OrdersScreen extends StatefulWidget {
  final BackendService service;
  final bool loggedIn;
  final VoidCallback onNeedsLogin;

  const OrdersScreen({
    super.key,
    required this.service,
    required this.loggedIn,
    required this.onNeedsLogin,
  });

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  List<Map<String, dynamic>> _orders = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    if (widget.loggedIn) _fetch();
  }

  @override
  void didUpdateWidget(OrdersScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Refresh orders if logged in status changed or screen is visited
    if (widget.loggedIn && oldWidget.loggedIn != widget.loggedIn) {
      debugPrint('📋 Orders Screen: Login status changed, fetching orders...');
      _fetch();
    } else if (widget.loggedIn) {
      debugPrint('📋 Orders Screen: Refreshing orders...');
      _fetch();
    }
  }

  Future<void> _fetch() async {
    if (!mounted) return;
    setState(() => _loading = true);
    try {
      debugPrint('📋 Fetching orders...');
      final res = await widget.service.getOrders();
      debugPrint('📋 Orders response: $res');
      debugPrint('📋 Orders count: ${res.length}');
      if (mounted) {
        setState(() => _orders = res);
        debugPrint('✅ Orders loaded: ${_orders.length} orders');
      }
    } catch (e) {
      debugPrint('❌ Orders fetch error: $e');
      if (mounted) {
        setState(() => _orders = []);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to load orders: $e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text(
          'Order History',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: !widget.loggedIn
            ? Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.lock_outline,
                      size: 56,
                      color: Colors.grey,
                    ),
                    const SizedBox(height: 12),
                    const Text('Please login to view orders'),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: widget.onNeedsLogin,
                      child: const Text('Go to Login'),
                    ),
                  ],
                ),
              )
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Tracking purchases.',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF061233),
                    ),
                  ),
                  const Text(
                    'Manage and track your recent electronics orders.',
                    style: TextStyle(color: Colors.grey, fontSize: 14),
                  ),
                  const SizedBox(height: 24),
                  _RefreshingIndicator(isLoading: _loading),
                  const SizedBox(height: 32),
                  Expanded(
                    child: _loading
                        ? const Center(child: CircularProgressIndicator())
                        : _orders.isEmpty
                        ? const Center(child: Text('No order history found.'))
                        : ListView.builder(
                            itemCount: _orders.length,
                            itemBuilder: (ctx, i) =>
                                _OrderHistoryCard(order: _orders[i]),
                          ),
                  ),
                  const SizedBox(height: 24),
                  _FullWidthButton(
                    label: 'Continue Shopping',
                    icon: Icons.shopping_bag_outlined,
                    onTap: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
      ),
    );
  }
}

// --- Product Details Screen ---
class ProductDetailsScreen extends StatefulWidget {
  final Map<String, dynamic> product;
  final BackendService service;
  final VoidCallback onCartUpdated;
  final String? username;

  const ProductDetailsScreen({
    super.key,
    required this.product,
    required this.service,
    required this.onCartUpdated,
    this.username,
  });

  @override
  State<ProductDetailsScreen> createState() => _ProductDetailsScreenState();
}

class _ProductDetailsScreenState extends State<ProductDetailsScreen> {
  // final SupabaseSyncService _supabaseSync = SupabaseSyncService.instance;
  List<Map<String, dynamic>> _priceHistory = [];
  bool _loadingHistory = false;

  @override
  void initState() {
    super.initState();
    _loadPriceHistory();
  }

  Future<void> _loadPriceHistory() async {
    setState(() => _loadingHistory = true);
    try {
      final price = double.tryParse('${widget.product['price']}') ?? 100;
      final data = await widget.service.getPriceHistory(price);
      final raw = data['history'];
      if (raw is List) {
        setState(() {
          _priceHistory = raw
              .whereType<Map>()
              .map((item) => Map<String, dynamic>.from(item))
              .toList();
        });
      }
    } catch (e) {
      debugPrint('Price history error: $e');
    } finally {
      setState(() => _loadingHistory = false);
    }
  }

  Future<void> _showAiSummary() async {
    final title = '${widget.product['title'] ?? 'Product'}';
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('AI Summary'),
        content: FutureBuilder<String>(
          future: widget.service.getAiSummary(title),
          builder: (context, snapshot) {
            if (!snapshot.hasData) {
              return const SizedBox(
                height: 60,
                child: Center(child: CircularProgressIndicator()),
              );
            }
            return Text(snapshot.data ?? 'No summary available.');
          },
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Future<void> _setAlert() async {
    final currentPrice = double.tryParse('${widget.product['price']}') ?? 0;
    final targetCtrl = TextEditingController(
      text: (currentPrice * 0.9).toStringAsFixed(2),
    );
    final emailCtrl = TextEditingController();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Set Price Alert'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: targetCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Target Price'),
            ),
            TextField(
              controller: emailCtrl,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Save'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final title = '${widget.product['title'] ?? 'Product'}';
    final target = double.tryParse(targetCtrl.text) ?? 0;
    final email = emailCtrl.text.trim();

    final res = await widget.service.setAlert(
      title: title,
      targetPrice: target,
      email: email,
    );
    if (res.ok) {
      // await _supabaseSync.savePriceAlert(
      //   title: title,
      //   targetPrice: target,
      //   email: email,
      //   username: widget.username,
      // );
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Price alert set')));
      return;
    }

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(res.data['error'] ?? 'Failed to set alert')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text(
          'Product Details',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            onPressed: () {
              final product = widget.product;
              final title = '${product['title'] ?? 'Check this out'}';
              final price = '₹${product['price']}';
              final text = '$title at $price from Best Buy Finder';
              ScaffoldMessenger.of(
                context,
              ).showSnackBar(SnackBar(content: Text('Shared: $text')));
            },
          ),
          IconButton(
            icon: const Icon(Icons.favorite_border, color: Colors.red),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Added to Favorites!')),
              );
            },
          ),
        ],
        elevation: 0,
        backgroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(24),
              children: [
                _ProductImageHeader(imageUrl: widget.product['image']),
                const SizedBox(height: 24),
                Text(
                  'BESTBUYFINDER FEATURED',
                  style: TextStyle(
                    color: Colors.blue.shade700,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  widget.product['title'] ?? 'Product Name',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF061233),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Text(
                      '₹${widget.product['price']}',
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF061233),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      '₹${(double.tryParse('${widget.product['price']}') ?? 0) * 1.5}',
                      style: const TextStyle(
                        color: Colors.grey,
                        decoration: TextDecoration.lineThrough,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE8F5E9),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'SAVE 33%',
                        style: TextStyle(
                          color: Colors.green,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _showAiSummary,
                        icon: const Icon(Icons.smart_toy_outlined),
                        label: const Text('AI Summary'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _setAlert,
                        icon: const Icon(Icons.notifications_active_outlined),
                        label: const Text('Set Alert'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _PriceHistorySection(
                  history: _priceHistory,
                  loading: _loadingHistory,
                ),
              ],
            ),
          ),
          _DetailsBottomActions(
            onAdd: () async {
              try {
                debugPrint('🛒 Adding to cart: ${widget.product['title']}');
                final response = await widget.service.addToCart(widget.product);

                if (response.ok) {
                  debugPrint('✅ Added to cart successfully');
                  widget.onCartUpdated();
                  if (mounted) {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('✓ Added to cart'),
                        duration: Duration(seconds: 1),
                      ),
                    );
                  }
                } else {
                  debugPrint('❌ Failed to add to cart: ${response.data}');
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          'Failed: ${response.data['error'] ?? 'Unknown error'}',
                        ),
                        duration: const Duration(seconds: 2),
                      ),
                    );
                  }
                }
              } catch (e) {
                debugPrint('❌ Add to cart exception: $e');
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Error: $e'),
                      duration: const Duration(seconds: 2),
                    ),
                  );
                }
              }
            },
            product: widget.product,
            service: widget.service,
            onCartUpdated: widget.onCartUpdated,
          ),
        ],
      ),
    );
  }
}

// --- UI Components ---

// --- HOME SCREEN ---
class HomeScreen extends StatefulWidget {
  final BackendService service;
  final VoidCallback onCartUpdated;
  final String? username;

  const HomeScreen({
    super.key,
    required this.service,
    required this.onCartUpdated,
    this.username,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Map<String, dynamic>> _featuredProducts = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchFeatured();
  }

  Future<void> _fetchFeatured() async {
    setState(() => _loading = true);
    try {
      debugPrint('🏠 Fetching featured products for home...');
      final res = await widget.service.getProducts();
      debugPrint('🏠 Fetched ${res.length} products');
      setState(() {
        _featuredProducts = res.take(6).toList();
      });
    } catch (e) {
      debugPrint('❌ Home fetch error: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        children: [
          // --- Welcome Header ---
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Welcome back!',
                    style: TextStyle(fontSize: 14, color: Colors.grey),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    widget.username ?? 'Best Buy Finder',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF061233),
                    ),
                  ),
                ],
              ),
              Stack(
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: const Color(0xFF197EF1).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.notifications_outlined,
                      color: Color(0xFF197EF1),
                    ),
                  ),
                  Positioned(
                    right: 8,
                    top: 8,
                    child: Container(
                      width: 10,
                      height: 10,
                      decoration: const BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),

          // --- Promotional Banner ---
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF197EF1), Color(0xFF105BE3)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Special Offer',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Get up to 40% off on electronics',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Shop Now',
                    style: TextStyle(
                      color: Color(0xFF197EF1),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),

          // --- Quick Categories ---
          const Text(
            'Shop by Category',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF061233),
            ),
          ),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 4,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            children: [
              _CategoryQuickCard(
                icon: Icons.laptop_mac,
                label: 'Laptops',
                onTap: () => Navigator.pop(context),
              ),
              _CategoryQuickCard(
                icon: Icons.phone_android,
                label: 'Phones',
                onTap: () => Navigator.pop(context),
              ),
              _CategoryQuickCard(
                icon: Icons.headphones,
                label: 'Audio',
                onTap: () => Navigator.pop(context),
              ),
              _CategoryQuickCard(
                icon: Icons.videogame_asset,
                label: 'Gaming',
                onTap: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 32),

          // --- Featured Section ---
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Featured Deals',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF061233),
                ),
              ),
              TextButton(
                onPressed: () {
                  DefaultTabController.of(context).animateTo(1);
                },
                child: const Text(
                  'Browse All',
                  style: TextStyle(color: Color(0xFF197EF1)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _loading
              ? const Center(child: CircularProgressIndicator())
              : ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _featuredProducts.length,
                  itemBuilder: (ctx, i) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _HomeProductCard(
                      product: _featuredProducts[i],
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => ProductDetailsScreen(
                              product: _featuredProducts[i],
                              service: widget.service,
                              onCartUpdated: widget.onCartUpdated,
                              username: widget.username,
                            ),
                          ),
                        );
                      },
                      onAdd: () async {
                        try {
                          final response = await widget.service.addToCart(
                            _featuredProducts[i],
                          );
                          if (response.ok) {
                            widget.onCartUpdated();
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('✓ Added to cart'),
                                  duration: Duration(seconds: 1),
                                ),
                              );
                            }
                          }
                        } catch (e) {
                          debugPrint('Error: $e');
                        }
                      },
                    ),
                  ),
                ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _CategoryQuickCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _CategoryQuickCard({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade100),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 32, color: const Color(0xFF197EF1)),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Color(0xFF061233),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HomeProductCard extends StatelessWidget {
  final Map<String, dynamic> product;
  final VoidCallback onTap;
  final VoidCallback onAdd;

  const _HomeProductCard({
    required this.product,
    required this.onTap,
    required this.onAdd,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade100),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: product['image'] != null
                  ? Image.network(product['image'], fit: BoxFit.cover)
                  : const Icon(Icons.image, color: Colors.grey),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product['title'] ?? 'Product',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF061233),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '₹${product['price']}',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF197EF1),
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    height: 36,
                    child: ElevatedButton.icon(
                      onPressed: onAdd,
                      icon: const Icon(Icons.add_shopping_cart, size: 14),
                      label: const Text('Add'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF197EF1),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DiscoveryHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        const Icon(Icons.menu, color: Color(0xFF061233)),
        const Text(
          'Search Products',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Color(0xFF061233),
          ),
        ),
        Stack(
          children: [
            const Icon(
              Icons.notifications_none_outlined,
              color: Color(0xFF061233),
            ),
            Positioned(
              right: 2,
              top: 2,
              child: Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _SearchBar extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;

  const _SearchBar({
    required this.controller,
    this.onChanged,
    this.onSubmitted,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: const Color(0xFFF7F9FC),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          const Icon(Icons.search, color: Colors.grey),
          const SizedBox(width: 12),
          Expanded(
            child: TextField(
              controller: controller,
              onChanged: onChanged,
              onSubmitted: onSubmitted,
              decoration: const InputDecoration(
                hintText: 'Search products, brands, or stores',
                border: InputBorder.none,
                hintStyle: TextStyle(color: Colors.grey, fontSize: 14),
              ),
            ),
          ),
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: const Color(0xFF197EF1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.tune, color: Colors.white, size: 18),
          ),
        ],
      ),
    );
  }
}

class _CategoryFilters extends StatelessWidget {
  final String selected;
  final Function(String) onChanged;
  const _CategoryFilters({required this.selected, required this.onChanged});
  @override
  Widget build(BuildContext context) {
    final cats = [
      ('All', 'All'),
      ('macys', 'Macy\'s'),
      ('nordstrom', 'Nordstrom'),
      ('sephora', 'Sephora'),
      ('barnesandnoble', 'Barnes & Noble'),
      ('dicks', 'Dick\'s'),
      ('homedepot', 'Home Depot'),
      ('chewy', 'Chewy'),
      ('guitarcenter', 'Guitar Center'),
      ('staples', 'Staples'),
      ('amazon', 'Amazon'),
      ('bestbuy', 'Best Buy'),
      ('walmart', 'Walmart'),
      ('ebay', 'eBay'),
      ('target', 'Target'),
    ];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: cats.map((cat) {
          final value = cat.$1;
          final label = cat.$2;
          final isSel = selected == value;
          return GestureDetector(
            onTap: () => onChanged(value),
            child: Container(
              margin: const EdgeInsets.only(right: 12),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              decoration: BoxDecoration(
                color: isSel
                    ? const Color(0xFF197EF1)
                    : const Color(0xFFF7F9FC),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                label,
                style: TextStyle(
                  color: isSel ? Colors.white : Colors.grey.shade700,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _BestDealCard extends StatelessWidget {
  final Map<String, dynamic>? product;
  final VoidCallback onTap;
  const _BestDealCard({required this.product, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final title =
        '${product?['title'] ?? product?['name'] ?? 'Top deal today'}';
    final source = '${product?['source'] ?? 'Featured'}';
    final price = double.tryParse('${product?['price']}') ?? 0;
    final oldPrice = price > 0 ? (price * 1.3) : 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Icon(Icons.auto_awesome, color: Color(0xFF197EF1), size: 18),
            SizedBox(width: 8),
            Text(
              'Best Deal Found',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: Color(0xFF061233),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        GestureDetector(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF197EF1), Color(0xFF105BE3)],
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF197EF1).withOpacity(0.3),
                  blurRadius: 15,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.9),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(
                    Icons.headphones,
                    size: 50,
                    color: Color(0xFF197EF1),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          source.toUpperCase(),
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Text(
                            '₹${price.toStringAsFixed(2)}',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            oldPrice > 0
                                ? '₹${oldPrice.toStringAsFixed(2)}'
                                : '',
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.6),
                              fontSize: 14,
                              decoration: TextDecoration.lineThrough,
                            ),
                          ),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Text(
                              'View Deal',
                              style: TextStyle(
                                color: Color(0xFF197EF1),
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _DiscoveryProductCard extends StatelessWidget {
  final Map<String, dynamic> product;
  final VoidCallback onTap;
  final VoidCallback onAdd;

  const _DiscoveryProductCard({
    required this.product,
    required this.onTap,
    required this.onAdd,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.shade100),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Stack(
                children: [
                  Container(
                    width: double.infinity,
                    decoration: const BoxDecoration(
                      color: Color(0xFFF7F9FC),
                      borderRadius: BorderRadius.vertical(
                        top: Radius.circular(20),
                      ),
                    ),
                    child: product['image'] != null
                        ? Image.network(
                            product['image'],
                            fit: BoxFit.contain,
                            errorBuilder: (_, __, ___) =>
                                const Icon(Icons.image),
                          )
                        : const Icon(Icons.image),
                  ),
                  Positioned(
                    top: 10,
                    left: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        product['source']?.toString().toUpperCase() ?? 'STORE',
                        style: const TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 32,
                    left: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF197EF1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.bolt, color: Colors.white, size: 8),
                          SizedBox(width: 2),
                          Text(
                            'AI PICK',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 8,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product['title'] ?? 'Product',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: Color(0xFF061233),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '₹${product['price']}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF197EF1),
                          fontSize: 16,
                        ),
                      ),
                      Row(
                        children: [
                          Icon(
                            Icons.history,
                            color: Colors.grey.shade400,
                            size: 18,
                          ),
                          const SizedBox(width: 8),
                          GestureDetector(
                            onTap: onAdd,
                            child: Icon(
                              Icons.shopping_cart_outlined,
                              color: Colors.grey.shade400,
                              size: 18,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyCartState extends StatelessWidget {
  final VoidCallback onStart;
  const _EmptyCartState({required this.onStart});
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: const BoxDecoration(
                color: Color(0xFFE3F2FD),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.remove_shopping_cart_outlined,
                color: Color(0xFF197EF1),
                size: 40,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Your cart is empty',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: Color(0xFF061233),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Looks like you haven\'t added anything to your cart yet. Let\'s find some deals!',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, fontSize: 14),
            ),
            const SizedBox(height: 32),
            _FullWidthButton(label: 'Start Shopping', onTap: onStart),
          ],
        ),
      ),
    );
  }
}

class _CartListItem extends StatelessWidget {
  final Map<String, dynamic> item;
  final VoidCallback onRemove;
  const _CartListItem({required this.item, required this.onRemove});
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: const Color(0xFFF7F9FC),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.shopping_bag_outlined, color: Colors.grey),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item['title'] ?? 'Item',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                Text(
                  '₹${item['price']} x ${item['quantity']}',
                  style: const TextStyle(
                    color: Color(0xFF197EF1),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline, color: Colors.red),
            onPressed: onRemove,
          ),
        ],
      ),
    );
  }
}

class _CartSuggestionTile extends StatelessWidget {
  final Map<String, dynamic> item;
  final VoidCallback onAdd;

  const _CartSuggestionTile({required this.item, required this.onAdd});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${item['title'] ?? item['name'] ?? 'Suggested item'}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                Text(
                  '₹${item['price'] ?? '-'}',
                  style: const TextStyle(
                    color: Color(0xFF197EF1),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: onAdd,
            icon: const Icon(Icons.add_circle_outline),
          ),
        ],
      ),
    );
  }
}

class _OrderSummary extends StatelessWidget {
  final List<Map<String, dynamic>> items;
  const _OrderSummary({required this.items});
  @override
  Widget build(BuildContext context) {
    final subtotal = items.fold<double>(
      0,
      (prev, element) =>
          prev +
          (double.tryParse('${element['price']}') ?? 0) *
              (int.tryParse('${element['quantity']}') ?? 1),
    );
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFFF7F9FC),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Order Summary',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 16),
          _SummaryRow(
            label: 'Subtotal',
            val: '₹${subtotal.toStringAsFixed(2)}',
          ),
          _SummaryRow(label: 'Shipping', val: '₹0.00'),
          _SummaryRow(label: 'Estimated Tax', val: '₹0.00'),
          const Divider(height: 24),
          _SummaryRow(
            label: 'Total',
            val: '₹${subtotal.toStringAsFixed(2)}',
            isTotal: true,
          ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label, val;
  final bool isTotal;
  const _SummaryRow({
    required this.label,
    required this.val,
    this.isTotal = false,
  });
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: isTotal ? Colors.black : Colors.grey,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              fontSize: isTotal ? 16 : 14,
            ),
          ),
          Text(
            val,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: isTotal ? 18 : 14,
            ),
          ),
        ],
      ),
    );
  }
}

class _CheckoutButton extends StatelessWidget {
  final VoidCallback onTap;
  const _CheckoutButton({required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 60,
        decoration: BoxDecoration(
          color: const Color(0xFFBBDEFB),
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Center(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.lock_outline, color: Color(0xFF197EF1)),
              SizedBox(width: 8),
              Text(
                'Checkout',
                style: TextStyle(
                  color: Color(0xFF197EF1),
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RefreshingIndicator extends StatelessWidget {
  final bool isLoading;
  const _RefreshingIndicator({required this.isLoading});
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            SizedBox(
              width: 14,
              height: 14,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                value: isLoading ? null : 1.0,
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'Refreshing your order list...',
              style: TextStyle(color: Color(0xFF197EF1), fontSize: 13),
            ),
          ],
        ),
        const SizedBox(height: 12),
        LinearProgressIndicator(
          value: isLoading ? null : 1.0,
          backgroundColor: Colors.grey.shade100,
          color: const Color(0xFF197EF1),
          borderRadius: BorderRadius.circular(10),
        ),
      ],
    );
  }
}

// --- Track Order Screen ---
class TrackOrderScreen extends StatefulWidget {
  final Map<String, dynamic> order;

  const TrackOrderScreen({super.key, required this.order});

  @override
  State<TrackOrderScreen> createState() => _TrackOrderScreenState();
}

class _TrackOrderScreenState extends State<TrackOrderScreen> {
  late List<TrackingStep> _steps;

  @override
  void initState() {
    super.initState();
    _initializeTrackingSteps();
  }

  void _initializeTrackingSteps() {
    final status = widget.order['status'] ?? 'SHIPPED';
    _steps = [
      TrackingStep(
        title: 'Order Placed',
        description: 'Your order has been confirmed',
        date: 'Oct 24, 2023',
        completed: true,
        active: true,
      ),
      TrackingStep(
        title: 'Processing',
        description: 'We\'re packing your items',
        date: 'Oct 24, 2023',
        completed: true,
        active: status == 'PROCESSING',
      ),
      TrackingStep(
        title: 'Shipped',
        description: 'On the way to you',
        date: 'Oct 25, 2023',
        completed: status == 'SHIPPED' || status == 'DELIVERED',
        active: status == 'SHIPPED',
      ),
      TrackingStep(
        title: 'Delivered',
        description: 'Delivered to your address',
        date: 'Oct 27, 2023',
        completed: status == 'DELIVERED',
        active: false,
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final total = widget.order['total_amount'] ?? 0;

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text(
          'Order Tracking',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Order Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade100),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Order #BBF-${widget.order['id']}',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF061233),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Placed on Oct 24, 2023',
                            style: TextStyle(fontSize: 12, color: Colors.grey),
                          ),
                        ],
                      ),
                      _StatusTag(status: widget.order['status'] ?? 'SHIPPED'),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Divider(color: Colors.grey.shade100),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Order Total',
                        style: TextStyle(color: Colors.grey, fontSize: 14),
                      ),
                      Text(
                        '₹$total',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                          color: Color(0xFF061233),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            // Tracking Timeline
            const Text(
              'Tracking Details',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF061233),
              ),
            ),
            const SizedBox(height: 24),
            ..._steps.asMap().entries.map((entry) {
              final index = entry.key;
              final step = entry.value;
              final isLast = index == _steps.length - 1;

              return Column(
                children: [
                  Row(
                    children: [
                      Column(
                        children: [
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: step.completed
                                  ? const Color(0xFF197EF1)
                                  : (step.active
                                        ? const Color(
                                            0xFF197EF1,
                                          ).withOpacity(0.2)
                                        : Colors.grey.shade200),
                              border: Border.all(
                                color: step.active
                                    ? const Color(0xFF197EF1)
                                    : Colors.transparent,
                                width: 2,
                              ),
                            ),
                            child: Center(
                              child: step.completed
                                  ? const Icon(
                                      Icons.check,
                                      color: Colors.white,
                                      size: 20,
                                    )
                                  : (step.active
                                        ? Container(
                                            width: 12,
                                            height: 12,
                                            decoration: const BoxDecoration(
                                              shape: BoxShape.circle,
                                              color: Color(0xFF197EF1),
                                            ),
                                          )
                                        : const SizedBox()),
                            ),
                          ),
                          if (!isLast)
                            Container(
                              width: 2,
                              height: 60,
                              color: step.completed
                                  ? const Color(0xFF197EF1)
                                  : Colors.grey.shade200,
                              margin: const EdgeInsets.symmetric(vertical: 8),
                            ),
                        ],
                      ),
                      const SizedBox(width: 20),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              step.title,
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: step.active
                                    ? const Color(0xFF197EF1)
                                    : const Color(0xFF061233),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              step.description,
                              style: const TextStyle(
                                fontSize: 13,
                                color: Colors.grey,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              step.date,
                              style: const TextStyle(
                                fontSize: 12,
                                color: Colors.grey,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              );
            }),
            const SizedBox(height: 32),
            // Contact Support Button
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text(
                        '📧 Email: vbhogal5@gmail.com | 📞 +91 8112006',
                      ),
                      duration: Duration(seconds: 2),
                    ),
                  );
                },
                icon: const Icon(Icons.headset_mic_outlined),
                label: const Text('Contact Support'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF197EF1),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class TrackingStep {
  final String title;
  final String description;
  final String date;
  final bool completed;
  final bool active;

  TrackingStep({
    required this.title,
    required this.description,
    required this.date,
    required this.completed,
    required this.active,
  });
}

class _OrderHistoryCard extends StatelessWidget {
  final Map<String, dynamic> order;
  const _OrderHistoryCard({required this.order});
  @override
  Widget build(BuildContext context) {
    final status = order['status'] ?? 'SHIPPED';
    final isShipped = status == 'SHIPPED';
    final isDelivered = status == 'DELIVERED';
    return GestureDetector(
      onTap: isShipped
          ? () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => TrackOrderScreen(order: order)),
            )
          : null,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.shade100),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  width: 70,
                  height: 70,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.laptop, color: Colors.grey),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              'Order #BBF-${order['id']}',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                          _StatusTag(status: status),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Oct 24, 2023 • 2 Items',
                        style: TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '₹${order['total_amount']}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF061233),
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 44,
              child: ElevatedButton(
                onPressed: isShipped
                    ? () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => TrackOrderScreen(order: order),
                        ),
                      )
                    : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: isShipped
                      ? const Color(0xFF197EF1)
                      : Colors.grey.shade100,
                  disabledBackgroundColor: Colors.grey.shade100,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  isShipped
                      ? 'Track Order'
                      : (isDelivered ? 'View Details' : 'Reorder'),
                  style: TextStyle(
                    color: isShipped ? Colors.white : Colors.black,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusTag extends StatelessWidget {
  final String status;
  const _StatusTag({required this.status});
  @override
  Widget build(BuildContext context) {
    final color = status == 'SHIPPED'
        ? Colors.blue
        : (status == 'DELIVERED' ? Colors.grey : Colors.red);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: color,
          fontSize: 8,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

class _ProductImageHeader extends StatelessWidget {
  final String? imageUrl;
  const _ProductImageHeader({this.imageUrl});
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 300,
      width: double.infinity,
      decoration: BoxDecoration(
        color: const Color(0xFFF7F9FC),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Stack(
        children: [
          Center(
            child: imageUrl != null
                ? Image.network(imageUrl!, fit: BoxFit.contain)
                : const Icon(Icons.headphones, size: 150, color: Colors.grey),
          ),
          Positioned(
            top: 20,
            left: 20,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFF197EF1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Row(
                children: [
                  Icon(Icons.check_circle, color: Colors.white, size: 14),
                  SizedBox(width: 4),
                  Text(
                    'BEST PRICE FOUND',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PriceHistorySection extends StatelessWidget {
  final List<Map<String, dynamic>> history;
  final bool loading;

  const _PriceHistorySection({required this.history, required this.loading});

  @override
  Widget build(BuildContext context) {
    final points = history.isNotEmpty
        ? history
        : List<Map<String, dynamic>>.generate(
            7,
            (i) => <String, dynamic>{'price': 20 + (i * 8)},
          );

    final prices = points
        .map((item) => double.tryParse('${item['price']}') ?? 0)
        .toList();
    final maxPrice = prices.isEmpty
        ? 1
        : prices.reduce((a, b) => a > b ? a : b);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFF7F9FC),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'PRICE HISTORY',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.grey,
                  fontSize: 12,
                ),
              ),
              Row(
                children: [
                  const Icon(
                    Icons.trending_down,
                    color: Colors.green,
                    size: 14,
                  ),
                  const SizedBox(width: 4),
                  const Text(
                    'Lowest in 30 days',
                    style: TextStyle(color: Colors.green, fontSize: 12),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          if (loading)
            const SizedBox(
              height: 90,
              child: Center(child: CircularProgressIndicator()),
            )
          else
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: List<Widget>.generate(prices.length.clamp(1, 7), (idx) {
                final itemIndex = prices.length <= 7
                    ? idx
                    : ((idx + 1) * prices.length / 7).floor() - 1;
                final safeIndex = itemIndex.clamp(0, prices.length - 1);
                final normalized =
                    (prices[safeIndex] / (maxPrice == 0 ? 1 : maxPrice)) * 70;
                final barHeight = normalized < 10 ? 10.0 : normalized;
                return _Bar(h: barHeight, isActive: idx == 6);
              }),
            ),
        ],
      ),
    );
  }
}

class _Bar extends StatelessWidget {
  final double h;
  final bool isActive;
  const _Bar({required this.h, this.isActive = false});
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 35,
      height: h,
      decoration: BoxDecoration(
        color: isActive ? const Color(0xFF197EF1) : const Color(0xFFE3F2FD),
        borderRadius: BorderRadius.circular(4),
      ),
    );
  }
}

class _DetailsBottomActions extends StatelessWidget {
  final VoidCallback onAdd;
  final Map<String, dynamic>? product;
  final BackendService? service;
  final VoidCallback? onCartUpdated;

  const _DetailsBottomActions({
    required this.onAdd,
    this.product,
    this.service,
    this.onCartUpdated,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey.shade100)),
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: onAdd,
              child: Container(
                height: 60,
                decoration: BoxDecoration(
                  color: const Color(0xFFF7F9FC),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Center(
                  child: Text(
                    'ADD TO CART',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: Color(0xFF061233),
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: _FullWidthButton(
              label: 'BUY NOW',
              onTap: () async {
                if (product != null &&
                    service != null &&
                    onCartUpdated != null) {
                  try {
                    debugPrint('🛍️ Direct purchase: ${product!['title']}');
                    final response = await service!.addToCart(product!);

                    if (response.ok) {
                      debugPrint('✅ Added to cart for checkout');
                      onCartUpdated!();
                      if (Navigator.canPop(context)) {
                        Navigator.pop(context);
                      }
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text(
                            '✓ Item added. Proceeding to checkout...',
                          ),
                          duration: Duration(seconds: 2),
                        ),
                      );
                      // Navigate to checkout screen
                      Future.delayed(const Duration(milliseconds: 500), () {
                        if (Navigator.canPop(context)) {
                          Navigator.of(
                            context,
                          ).pushNamed('/checkout').catchError((_) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Checkout screen not available'),
                              ),
                            );
                          });
                        }
                      });
                    } else {
                      debugPrint('❌ Failed to add to cart: ${response.data}');
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            'Failed: ${response.data['error'] ?? 'Unknown error'}',
                          ),
                        ),
                      );
                    }
                  } catch (e) {
                    debugPrint('❌ Buy now exception: $e');
                    ScaffoldMessenger.of(
                      context,
                    ).showSnackBar(SnackBar(content: Text('Error: $e')));
                  }
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Buy now feature is initializing...'),
                    ),
                  );
                }
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileMenuTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _ProfileMenuTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: const Color(0xFF197EF1).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: const Color(0xFF197EF1), size: 24),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF061233),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios,
                  size: 16,
                  color: Colors.grey.shade400,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _FullWidthButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback onTap;
  const _FullWidthButton({required this.label, this.icon, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 60,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF197EF1), Color(0xFF10BFE3)],
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF197EF1).withOpacity(0.3),
              blurRadius: 10,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Center(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[
                Icon(icon, color: Colors.white),
                const SizedBox(width: 8),
              ],
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ============ WISHLIST SCREEN ============
class WishlistScreen extends StatefulWidget {
  final BackendService service;
  const WishlistScreen({super.key, required this.service});
  @override
  State<WishlistScreen> createState() => _WishlistScreenState();
}

class _WishlistScreenState extends State<WishlistScreen> {
  List<Map<String, dynamic>> _wishlist = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadWishlist();
  }

  Future<void> _loadWishlist() async {
    // Mock wishlist data - in production, this would come from backend
    setState(() {
      _wishlist = [
        {
          'id': '1',
          'title': 'iPhone 15 Pro',
          'price': 99999,
          'image': 'https://via.placeholder.com/150',
        },
        {
          'id': '2',
          'title': 'Sony WH-1000XM5',
          'price': 29999,
          'image': 'https://via.placeholder.com/150',
        },
      ];
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
      decoration: const BoxDecoration(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        color: Colors.white,
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'My Wishlist',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: const Icon(Icons.close),
                ),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _wishlist.isEmpty
                ? const Center(child: Text('No items in wishlist'))
                : ListView.builder(
                    itemCount: _wishlist.length,
                    itemBuilder: (ctx, idx) {
                      final item = _wishlist[idx];
                      return Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        child: Card(
                          child: ListTile(
                            leading: Container(
                              width: 60,
                              height: 60,
                              decoration: BoxDecoration(
                                color: Colors.grey.shade200,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(Icons.shopping_bag),
                            ),
                            title: Text(item['title']),
                            subtitle: Text('₹${item['price']}'),
                            trailing: GestureDetector(
                              onTap: () {
                                setState(() => _wishlist.removeAt(idx));
                              },
                              child: Icon(
                                Icons.favorite,
                                color: Colors.red.shade400,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
          if (_wishlist.isNotEmpty)
            Padding(
              padding: const EdgeInsets.all(16),
              child: _FullWidthButton(
                label: 'Add All to Cart',
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Added all items to cart')),
                  );
                  Navigator.pop(context);
                },
              ),
            ),
        ],
      ),
    );
  }
}

// ============ ADDRESSES SCREEN ============
class AddressesScreen extends StatefulWidget {
  final BackendService service;
  const AddressesScreen({super.key, required this.service});
  @override
  State<AddressesScreen> createState() => _AddressesScreenState();
}

class _AddressesScreenState extends State<AddressesScreen> {
  final List<Map<String, dynamic>> _addresses = [
    {
      'id': '1',
      'name': 'Home',
      'address': '123 Main Street, City, State 12345',
      'isDefault': true,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
      decoration: const BoxDecoration(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        color: Colors.white,
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Addresses',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: const Icon(Icons.close),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              itemCount: _addresses.length,
              itemBuilder: (ctx, idx) {
                final addr = _addresses[idx];
                return Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                addr['name'],
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                              if (addr['isDefault'])
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.green.shade100,
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: const Text(
                                    'Default',
                                    style: TextStyle(
                                      color: Colors.green,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            addr['address'],
                            style: TextStyle(color: Colors.grey.shade600),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              TextButton.icon(
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Edit address'),
                                    ),
                                  );
                                },
                                icon: const Icon(Icons.edit),
                                label: const Text('Edit'),
                              ),
                              TextButton.icon(
                                onPressed: () {
                                  setState(() {
                                    _addresses.removeAt(idx);
                                  });
                                },
                                icon: const Icon(
                                  Icons.delete,
                                  color: Colors.red,
                                ),
                                label: const Text(
                                  'Delete',
                                  style: TextStyle(color: Colors.red),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: _FullWidthButton(
              icon: Icons.add,
              label: 'Add New Address',
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Add address form')),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ============ NOTIFICATIONS SETTINGS DIALOG ============
class NotificationsSettingsDialog extends StatefulWidget {
  const NotificationsSettingsDialog({super.key});

  @override
  State<NotificationsSettingsDialog> createState() =>
      _NotificationsSettingsDialogState();
}

class _NotificationsSettingsDialogState
    extends State<NotificationsSettingsDialog> {
  bool _emailNotifications = true;
  bool _pushNotifications = true;
  bool _orderUpdates = true;
  bool _promotions = false;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Notification Preferences'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _NotificationToggle(
              title: 'Email Notifications',
              value: _emailNotifications,
              onChanged: (val) => setState(() => _emailNotifications = val),
            ),
            _NotificationToggle(
              title: 'Push Notifications',
              value: _pushNotifications,
              onChanged: (val) => setState(() => _pushNotifications = val),
            ),
            _NotificationToggle(
              title: 'Order Updates',
              value: _orderUpdates,
              onChanged: (val) => setState(() => _orderUpdates = val),
            ),
            _NotificationToggle(
              title: 'Promotional Offers',
              value: _promotions,
              onChanged: (val) => setState(() => _promotions = val),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () {
            ScaffoldMessenger.of(
              context,
            ).showSnackBar(const SnackBar(content: Text('Preferences saved')));
            Navigator.pop(context);
          },
          child: const Text('Save'),
        ),
      ],
    );
  }
}

class _NotificationToggle extends StatelessWidget {
  final String title;
  final bool value;
  final Function(bool) onChanged;

  const _NotificationToggle({
    required this.title,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title),
          Switch(value: value, onChanged: onChanged),
        ],
      ),
    );
  }
}

// ============ LANGUAGE SETTINGS DIALOG ============
class LanguageSettingsDialog extends StatefulWidget {
  const LanguageSettingsDialog({super.key});

  @override
  State<LanguageSettingsDialog> createState() => _LanguageSettingsDialogState();
}

class _LanguageSettingsDialogState extends State<LanguageSettingsDialog> {
  String _selectedLanguage = 'English';
  final List<String> _languages = ['English', 'Hindi', 'Tamil', 'Telugu'];

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Select Language'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: _languages
              .map(
                (lang) => RadioListTile<String>(
                  title: Text(lang),
                  value: lang,
                  groupValue: _selectedLanguage,
                  onChanged: (val) {
                    if (val != null) {
                      setState(() => _selectedLanguage = val);
                    }
                  },
                ),
              )
              .toList(),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Language changed to $_selectedLanguage')),
            );
            Navigator.pop(context);
          },
          child: const Text('Save'),
        ),
      ],
    );
  }
}

// ============ HELP & SUPPORT SCREEN ============
class HelpSupportScreen extends StatelessWidget {
  final List<Map<String, String>> _faqs = [
    {
      'q': 'How do I place an order?',
      'a': 'Browse products, add to cart, and proceed to checkout.',
    },
    {
      'q': 'What is the return policy?',
      'a': '30 days money-back guarantee on all products.',
    },
    {
      'q': 'How can I track my order?',
      'a': 'Go to Order History to see real-time tracking updates.',
    },
    {
      'q': 'Do you offer international shipping?',
      'a': 'Currently, we ship only within India.',
    },
  ];

  HelpSupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
      decoration: const BoxDecoration(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        color: Colors.white,
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Help & Support',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: const Icon(Icons.close),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const Padding(
                  padding: EdgeInsets.all(8),
                  child: Text(
                    'Frequently Asked Questions',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
                ..._faqs.map((faq) {
                  return Card(
                    margin: const EdgeInsets.symmetric(vertical: 8),
                    child: ExpansionTile(
                      title: Text(faq['q'] ?? ''),
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Text(faq['a'] ?? ''),
                        ),
                      ],
                    ),
                  );
                }),
                const SizedBox(height: 24),
                const Padding(
                  padding: EdgeInsets.all(8),
                  child: Text(
                    'Contact Us',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '📧 Email: vbhogal5@gmail.com',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          '📞 Phone: +91 8112006',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          '⏰ Available: 9AM - 9PM (Monday - Friday)',
                          style: TextStyle(fontSize: 13, color: Colors.grey),
                        ),
                        const SizedBox(height: 12),
                        _FullWidthButton(
                          label: 'Send Email',
                          onTap: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Email form opened'),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class ProfileScreen extends StatefulWidget {
  final BackendService service;
  final bool loggedIn;
  final String? username;
  final Future<void> Function() onAuthUpdated;
  const ProfileScreen({
    super.key,
    required this.service,
    required this.loggedIn,
    this.username,
    required this.onAuthUpdated,
  });
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final TextEditingController _userCtrl = TextEditingController();
  final TextEditingController _passCtrl = TextEditingController();
  final AuthService _authService = AuthService();
  bool _isLogin = true;
  bool _loading = false;

  Future<void> _auth() async {
    setState(() => _loading = true);
    try {
      final res = _isLogin
          ? await widget.service.login(
              username: _userCtrl.text,
              password: _passCtrl.text,
            )
          : await widget.service.register(
              username: _userCtrl.text,
              password: _passCtrl.text,
            );
      if (res.ok) {
        // Save login state for persistent login
        if (_isLogin) {
          await _authService.saveLoginState(
            username: _userCtrl.text,
            sessionCookie: '',
          );
          debugPrint('✅ Login state saved');
        }

        if (mounted) {
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (_) => SuccessAnimationDialog(
              isLogin: _isLogin,
              onComplete: () async {
                Navigator.of(context).pop();
                await widget.onAuthUpdated();
              },
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(res.data['error'] ?? 'Auth failed')),
          );
        }
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.loggedIn) {
      return Scaffold(
        appBar: AppBar(
          title: const Text(
            'Profile',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
          ),
          centerTitle: true,
          elevation: 0,
          backgroundColor: Colors.white,
        ),
        body: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // --- Profile Header Section ---
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF197EF1), Color(0xFF105BE3)],
                    ),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Icon(
                          Icons.person,
                          size: 40,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        widget.username ?? 'User',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'vbhogal5@gmail.com',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.white.withOpacity(0.8),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '☎ +91 8112006',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.white.withOpacity(0.8),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // --- Account Section ---
                const Text(
                  'Account',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF061233),
                  ),
                ),
                const SizedBox(height: 12),
                _ProfileMenuTile(
                  icon: Icons.receipt_long,
                  title: 'Order History',
                  subtitle: 'View your past orders',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => OrdersScreen(
                          service: widget.service,
                          loggedIn: widget.loggedIn,
                          onNeedsLogin: () {},
                        ),
                      ),
                    );
                  },
                ),
                _ProfileMenuTile(
                  icon: Icons.favorite_outline,
                  title: 'Wishlist',
                  subtitle: 'Your saved items',
                  onTap: () => _showWishlistScreen(),
                ),
                _ProfileMenuTile(
                  icon: Icons.location_on_outlined,
                  title: 'Addresses',
                  subtitle: 'Manage delivery addresses',
                  onTap: () => _showAddressesScreen(),
                ),
                const SizedBox(height: 24),

                // --- Preferences Section ---
                const Text(
                  'Preferences',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF061233),
                  ),
                ),
                const SizedBox(height: 12),
                _ProfileMenuTile(
                  icon: Icons.notifications_outlined,
                  title: 'Notifications',
                  subtitle: 'Email & push alerts',
                  onTap: () => _showNotificationsSettings(),
                ),
                _ProfileMenuTile(
                  icon: Icons.language,
                  title: 'Language',
                  subtitle: 'English',
                  onTap: () => _showLanguageSettings(),
                ),
                const SizedBox(height: 24),

                // --- Support Section ---
                const Text(
                  'Support',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF061233),
                  ),
                ),
                const SizedBox(height: 12),
                _ProfileMenuTile(
                  icon: Icons.help_outline,
                  title: 'Help & Support',
                  subtitle: 'vbhogal5@gmail.com | +91 8112006',
                  onTap: () => _showHelpSupport(),
                ),
                _ProfileMenuTile(
                  icon: Icons.info_outline,
                  title: 'About',
                  subtitle: 'App version & info',
                  onTap: () => _showAbout(),
                ),
                const SizedBox(height: 32),

                // --- Logout Button ---
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.red.shade200),
                    borderRadius: BorderRadius.circular(16),
                    color: Colors.red.shade50,
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () async {
                        // Confirm logout
                        final confirmed = await showDialog<bool>(
                          context: context,
                          builder: (ctx) => AlertDialog(
                            title: const Text('Logout'),
                            content: const Text(
                              'Are you sure you want to logout?',
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(ctx, false),
                                child: const Text('Cancel'),
                              ),
                              ElevatedButton(
                                onPressed: () => Navigator.pop(ctx, true),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.red,
                                ),
                                child: const Text('Logout'),
                              ),
                            ],
                          ),
                        );

                        if (confirmed == true && mounted) {
                          await widget.service.logout();
                          await _authService.clearLoginState();
                          debugPrint('✅ Login state cleared');
                          await widget.onAuthUpdated();
                        }
                      },
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.logout, color: Colors.red.shade600),
                          const SizedBox(width: 8),
                          Text(
                            'Logout',
                            style: TextStyle(
                              color: Colors.red.shade600,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(32),
      child: Column(
        children: [
          const SizedBox(height: 40),
          AnimatedAppIcon(),
          const SizedBox(height: 32),
          Text(
            _isLogin ? 'Welcome Back' : 'Create Account',
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              color: Color(0xFF061233),
            ),
          ),
          const Text(
            'Sign in to access your account',
            style: TextStyle(color: Colors.grey, fontSize: 16),
          ),
          const SizedBox(height: 40),
          _AuthTextField(
            label: 'Username',
            controller: _userCtrl,
            hint: 'Enter your username',
            icon: Icons.person_outline,
          ),
          const SizedBox(height: 24),
          _AuthTextField(
            label: 'Password',
            controller: _passCtrl,
            hint: 'Enter your password',
            icon: Icons.lock_outline,
            isPassword: true,
          ),
          const SizedBox(height: 32),
          _loading
              ? const CircularProgressIndicator()
              : _FullWidthButton(
                  label: _isLogin ? 'Sign In →' : 'Register Now →',
                  onTap: _auth,
                ),
          const SizedBox(height: 32),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                _isLogin
                    ? 'Don\'t have an account? '
                    : 'Already have an account? ',
              ),
              GestureDetector(
                onTap: () => setState(() => _isLogin = !_isLogin),
                child: Text(
                  _isLogin ? 'Register' : 'Login',
                  style: const TextStyle(
                    color: Color(0xFF197EF1),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showWishlistScreen() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => WishlistScreen(service: widget.service),
    );
  }

  void _showAddressesScreen() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => AddressesScreen(service: widget.service),
    );
  }

  void _showNotificationsSettings() {
    showDialog(
      context: context,
      builder: (ctx) => NotificationsSettingsDialog(),
    );
  }

  void _showLanguageSettings() {
    showDialog(context: context, builder: (ctx) => LanguageSettingsDialog());
  }

  void _showHelpSupport() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => HelpSupportScreen(),
    );
  }

  void _showAbout() {
    showDialog(
      context: context,
      builder: (ctx) => AboutDialog(
        applicationName: 'Best Buy Finder',
        applicationVersion: '1.0.0',
        children: [
          const Text(
            'Your ultimate shopping companion for finding the best deals.',
          ),
          const SizedBox(height: 16),
          const Text('Version: 1.0.0'),
          const Text('© 2024 Best Buy Finder. All rights reserved.'),
        ],
      ),
    );
  }
}

class _AuthTextField extends StatelessWidget {
  final String label, hint;
  final TextEditingController controller;
  final IconData icon;
  final bool isPassword;
  const _AuthTextField({
    required this.label,
    required this.hint,
    required this.controller,
    required this.icon,
    this.isPassword = false,
  });
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: const Color(0xFFF7F9FC),
            borderRadius: BorderRadius.circular(16),
          ),
          child: TextField(
            controller: controller,
            obscureText: isPassword,
            decoration: InputDecoration(
              icon: Icon(icon, color: Colors.grey),
              border: InputBorder.none,
              hintText: hint,
            ),
          ),
        ),
      ],
    );
  }
}

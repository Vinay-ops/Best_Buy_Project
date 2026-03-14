import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_app/main.dart';

void main() {
  testWidgets('App renders new home UI', (WidgetTester tester) async {
    await tester.pumpWidget(const BestBuyFinderApp());

    expect(find.text('BestBuyFinder'), findsOneWidget);
    expect(find.text('Find the Best Deals'), findsOneWidget);
    expect(find.text('Across the Web'), findsOneWidget);
    expect(find.text('Start Browsing'), findsOneWidget);
    expect(find.text('Join Now'), findsOneWidget);
  });
}

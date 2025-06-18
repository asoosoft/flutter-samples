import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
      ),
      home: const WebViewExample(),
    );
  }
}

class WebViewExample extends StatefulWidget {
  const WebViewExample({super.key});

  @override
  State<WebViewExample> createState() => _WebViewExampleState();
}

class _WebViewExampleState extends State<WebViewExample> {
  final webViewKey = GlobalKey();
  late InAppWebViewController _inAppWebViewController;

  Future<void> getNativeMessage() async {
    const platform = MethodChannel('samples.flutter.dev/native');
    try {
      final args = {'key': 'value'}; // 네이티브로 전달할 인자 (Map 형태)
      final result = await platform.invokeMethod('getMessage', args);
      print(result); // "Hello from Android Native!{key: value}" 출력 예상
    } on PlatformException catch (e) {
      print(e.message);
    }
  }

  final settings = InAppWebViewSettings(
    webViewAssetLoader: WebViewAssetLoader(
      //WebViewAssetLoader로 정적 웹페이지를 로드합니다.
      //CORS정책을 우회하기 위해 file 프로토콜 대신 가상 도메인으로 매핑합니다.
      domain: "my.custom.domain.com", //웹뷰를 여러개 사용시 도메인을 분리하여 사용할 수 있습니다.
      pathHandlers: [
        // 웹뷰에서 정적 리소스를 불러올 수 있도록 '/assets/' 경로를 매핑합니다.
        AssetsPathHandler(path: '/assets/'),
      ],
    ),
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('InAppWebView Example')),
      body: Column(
        children: [
          Expanded(
            child: InAppWebView(
              //InAppWebView 위젯을 생성합니다.
              key: webViewKey,
              initialUrlRequest: URLRequest(
                url: WebUri(
                  'https://my.custom.domain.com/assets/flutter_assets/assets/www/index.html',
                ),
              ),
              onWebViewCreated: (controller) {
                _inAppWebViewController = controller;
                controller.addJavaScriptHandler(
                  handlerName: "myHandler",
                  callback: (args) {
                    print(args);
                    return {'result': '플러터에서 응답 $args'};
                  },
                );
              },

              ///flutter는 빌드후 assets에 포함된 리소스는 "/assets/flutter_assets"에 위치합니다.
              ///스파이더젠의 index.html은 "assets/index.html"에 위치하므로
              ///최종위치는"/assets/flutter_assets/assets/index.html"에 존재합니다.
              ///InAppWebViewSettings의 domain을 수정했다면 그에 맞게 수정해야 합니다.
              initialSettings: settings,
            ),
          ),
          TextButton(
            onPressed: () {
              _inAppWebViewController.postWebMessage(
                //postWebMessage 호출
                message: WebMessage(data: "postWebMessage 호출됨!"),
              );
            },
            child: Text("postWebMessage 호출"),
          ),
          TextButton(
            onPressed: () {
              _inAppWebViewController.evaluateJavascript(
                source: "window.postMessage('플러터에서 직접 웹뷰 이벤트 호출')",
              );
            },
            child: Text("직접 웹뷰 이벤트 호출"),
          ),
          TextButton(
            onPressed: () {
              _inAppWebViewController.evaluateJavascript(
                source: "webFunction('플러터에서 직접 웹뷰 함수 호출')",
              );
            },
            child: Text("직접 웹뷰 함수 호출"),
          ),
          TextButton(
            onPressed: getNativeMessage,
            child: const Text("플러터에서 네이티브 호출"),
          ),
        ],
      ),
    );
  }
}

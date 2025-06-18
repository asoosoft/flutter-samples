import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

final InAppLocalhostServer localhostServer = InAppLocalhostServer(
  documentRoot: 'assets/www',
);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await localhostServer.start();
  runApp(MaterialApp(home: const MyApp()));
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});
  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("InAppWebView LocalhostServer Example")),
      body: Column(
        children: <Widget>[
          Expanded(
            child: InAppWebView(
              initialUrlRequest: URLRequest(
                url: WebUri("http://localhost:8080/index.html"),
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

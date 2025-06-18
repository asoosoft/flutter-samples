# flutter-hybrid 예제

## 사용법

1. git clone 으로 프로젝트를 로컬환경에 설치합니다.![image](https://github.com/user-attachments/assets/87dd5980-b9d0-463a-a7a1-67a8f47223c1)


2. 우선 flutter-samples/WebViewExample/WebViewExample.prj 를 스파이더젠으로 실행합니다.![image](https://github.com/user-attachments/assets/aa1a80b8-c007-43a4-9ea0-e6b1b0f60815)


3. 실행한 스파이더젠 프로젝트를 **build - build project(F7)**로 빌드합니다.![image](https://github.com/user-attachments/assets/94dc018f-b09d-4545-97f4-5e9b9d33fade)


5. flutter_localserver_webview와 flutter_virtualdomain_webview 중 원하는 예제를 VisualStudioCode에서 실행합니다.![image](https://github.com/user-attachments/assets/03c7ba9f-2edb-40f4-b820-19cc62ce67dd)
 - flutter-samples/flutter_localserver_webview([로컬 서버 배포 가이드로 이동](https://app.gitbook.com/o/-LBZXDVJlvS84TyZbgov/s/a1djbpbzXMGAimyJz5v8/08.-mobile-app/02.-flutter-hybrid/02.-flutter/a.-android-ios))
 - flutter-samples/flutter_virtualdomain_webview([가상 도메인 배포](https://app.gitbook.com/o/-LBZXDVJlvS84TyZbgov/s/a1djbpbzXMGAimyJz5v8/08.-mobile-app/02.-flutter-hybrid/02.-flutter/b.-android))


7. flutter프로젝트 폴더에서 assets/www 폴더를 생성하고 스파이더젠으로 빌드한 "/bin" 내부 파일을 폴더에 붙여넣습니다.![image](https://github.com/user-attachments/assets/533022b5-7f58-477d-8ca7-a9f81c0a958d)


8. VSC 명령팔레트창에 Flutter:Launch Emulator를 찾아 선택하고 필요한 에뮬레이터를 실행합니다.![image](https://github.com/user-attachments/assets/41917d33-e45d-465a-9055-64be4a562b4f)


9. **lib/main.dart를 열고 F5를 누르거나 Run and Debug패널에서 버튼을 눌러** 앱을 실행합니다. ![image](https://github.com/user-attachments/assets/40543034-4f69-4760-b589-ce97fd332e6b)


10. 실행화면 ![image](https://github.com/user-attachments/assets/2b336750-5a8e-42f8-a0c5-78aea8521956)


MainView = class MainView extends AView
{
	constructor()
	{
		super()

		//TODO:edit here

	}

	onSubmitToFlutterButtonClick(_comp, _info, _e)
	{
        const inputText = this.inputField.getText();
        const resultTextBox = this.resultTextBox;

        if (!window.flutter_inappwebview) return;
        window.flutter_inappwebview.callHandler('myHandler', inputText)
        .then(function(response) {
            // 플러터에서 보낸 응답 처리
            console.log("플러터 함수 호출 성공"+response.result)
            resultTextBox.setText(response.result)
        });
	}

    // 만약 일반 메서드로 사용하고 싶다면 onInitDone(resultTextBox가 초기화된 이후)에서
    // this를 바인딩 해야합니다.
    // onMessageHandler(event)
    // {
    //     console.log("이벤트 핸들러 호출됨"+event.data);
    //     this.resultTextBox.setText(event.data);
    // }

    onMessageHandler = (event) =>
    {
        console.log("이벤트 핸들러 호출됨"+event.data);
        this.resultTextBox.setText(event.data);
    }

	init(context, evtListener)
	{
		super.init(context, evtListener)

		//TODO:edit here

	}

	onInitDone()
	{
		super.onInitDone()

        //전역객체에 전역함수를 등록해 통신하는 방법
        const resultTextBox = this.resultTextBox;
        window.webFunction = function(message)
        {
            console.log("전역함수 호출됨")
            resultTextBox.setText(message);
        }

        //this.onMessageHandler = this.onMessageHandler.bind(this);
	}

	onActiveDone(isFirst)
	{
		super.onActiveDone(isFirst)

        //전역객체에 메세지 이벤트를 등록해 통신하는 방법
        window.addEventListener("message", this.onMessageHandler);
	}

    onDeactiveDone()
    {
        super.onDeactiveDone()

        window.removeEventListener("message",this.onMessageHandler);
    }
}


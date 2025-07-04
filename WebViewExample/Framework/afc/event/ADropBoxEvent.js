
/**
 * @author asoocool
 */

class ADropBoxEvent extends AEvent
{
	constructor(acomp)
	{
		super(acomp);
	}
}
window.ADropBoxEvent = ADropBoxEvent;

//이렇게 하면 안됨. --> 왜 안되는지 확인되면 주석 달기
ADropBoxEvent.prototype.actionUpState = function()
{
	var $input = this.acomp.$ele.children('input');
	//if($input.attr('readonly') && this.acomp.isEnable)
	if(this.acomp.isEnable)
	{
		this.acomp.openBox();
	}
};

ADropBoxEvent.prototype.defaultAction = function()
{
	//이렇게 하면 안됨. --> 왜 안되는지 확인되면 주석 달기
	this._click();
	
	this._keydown();
};

//defaultAction 에서 호출했기 때문에 
//이벤트가 등록되어 있어도 호출되지 않도록 인터페이스를 닫는다.
ADropBoxEvent.prototype.keydown = null;

//---------------------------------------------------------------------------------------------------
//	Component Event Functions
//	events: ['select', 'change']

ADropBoxEvent.prototype.select = function()
{
	this._select();
};

ADropBoxEvent.prototype.change = function()
{
	this._change();
};

//---------------------------------------------------------------------------------------------------
/*
ADropBoxEvent.prototype._keydown = function()
{
	var adropbox = this.acomp;

	adropbox.$ele.on('keydown', function(e) 
	{
		if(!adropbox.keyPropagation) e.stopPropagation();
	
		setTimeout(function()
		{
			adropbox._keyDownManage(e);
		});
		
		adropbox.reportEvent('keydown', null, e);
	});
};
*/

ADropBoxEvent.prototype.onKeyDown = function(e)
{	
	var adropbox = this.acomp;

	if(adropbox!==AComponent.getFocusComp()) return;
	
	setTimeout(function()
	{
		adropbox._keyDownManage(e);
	}, 0);
	
	adropbox.reportEvent('keydown', null, e);
	
	return (adropbox.keyPropagation == false);
};


//왜 keyup 에서 하는지 확인해 보기
ADropBoxEvent.prototype._change = function()
{
	var adropbox = this.acomp;
	
	//이 이벤트가 발생하는지도 확인해 보기
	adropbox.$ele.on('keyup', function(e) 
	{
		adropbox.reportEvent('change', null, e);
	});
};

ADropBoxEvent.prototype._select = function(itemList)
{
    if(!itemList) return;
    
    var adropbox = this.acomp;
    var isTouchLeave = true, startX = 0, startY = 0, focusObj;
    
    AEvent.bindEvent(itemList, AEvent.ACTION_DOWN, function(e)
    {
        isTouchLeave = false;
		
		// blur 발생시 자체 이벤트로 처리하겠다는 변수
        adropbox.ACTION_UP = true;
		
		if(adropbox.eventStop) e.stopPropagation();
        
        //android 4.3 이하, BugFix
        //드랍박스는 기본적으로 상위로 전달되지 않도록 처리한다. 박스가 동적으로 생성되기 때문에 
		/*
        if(afc.andVer<4.4)
        {
			//스크롤이 작동되기 위해 상위로 전달되는 것을 막음.
			if(adropbox.isScroll()) e.stopPropagation();
		}
		*/
        
        var oe = e.changedTouches[0];
        startX = oe.clientX;
        startY = oe.clientY;
    });
    
	
	
    AEvent.bindEvent(itemList, AEvent.ACTION_MOVE, function(e)
    {
        var oe = e.changedTouches[0];
		
		if(adropbox.eventStop) e.stopPropagation();
		
		focusObj = $('.'+adropbox.focusClass);
		
		if(focusObj[0] != this)
		{
			focusObj.removeClass(adropbox.focusClass);
			$(this).addClass(adropbox.focusClass);
		}
		
        if(Math.abs(oe.clientX - startX) > AEvent.TOUCHLEAVE || Math.abs(oe.clientY - startY) > AEvent.TOUCHLEAVE)
        {
			//$(this).removeClass(adropbox.focusClass);
            isTouchLeave = true;
        }
    });

    AEvent.bindEvent(itemList, AEvent.ACTION_UP, function(e)
    {        
        if(isTouchLeave) return;
		
		if(adropbox.eventStop) e.stopPropagation();
		
		$(this).removeClass(adropbox.normalClass);
		$(this).addClass(adropbox.selectClass);
        adropbox.selectItem(this.index);
        
        var touchItem = this;
		setTimeout(function() 
		{ 
			adropbox.listPopupClose();
			if(!adropbox.isReadOnly)
			{
				var len = adropbox.getEditText().length;
				$(adropbox.textfield).focus();					
				adropbox.textfield.setSelectionRange(len, len);	// 마우스로 선택 후 커서위치 조정
			}
			adropbox.reportEvent('select', touchItem);
		}, 100);	
		
		//딜레이 10이상 주지 말것. 아이폰에서 오류날 수 있음.
		//10 이상 주려면 AppManager.touchDelay 를 먼저 호출해 줄것.(과거의 오류, 현재도 발생하는지 확인 필요)

        //touchend이벤트가 발생하면 아이템윈도우가 닫히면서 뒤에 있는 컴포넌트의 이벤트가 발생하는 버그대응
        //(touch이벤트이면서 뒤에 있는 컴포넌트가 다른 컨테이너에 있는 경우에 발생)
        if(!afc.isPC) e.preventDefault();
    });
    
    AEvent.bindEvent(itemList, AEvent.ACTION_CANCEL, function(e)
    {        
        isTouchLeave = true;
    });
	
    AEvent.bindEvent(itemList, 'mouseleave', function(e)
    {
		$(this).removeClass(adropbox.focusClass);
    });
};

     
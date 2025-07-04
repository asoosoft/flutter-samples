                 
/**
 * @author asoocool
 */

class ATreeEvent extends AEvent
{
	constructor(acomp)
	{
		super(acomp);
	}
}
window.ATreeEvent = ATreeEvent;


ATreeEvent.prototype.defaultAction = function()
{
	this._keydown();
};

//---------------------------------------------------------------------------------------------------
//	Component Event Functions



ATreeEvent.prototype.dblclick = function()
{
	this.dblclickBind = true;
};


//---------------------------------------------------------------------------------------------------


ATreeEvent.prototype._select = function(itemEle)
{
	//차후 소스 정리후 agrid 의 _itemClickManage 함수 내용을 이곳으로 옮기기
	
	this.acomp._itemClickManage(itemEle);
};

ATreeEvent.prototype._dblclick = function(itemEle)
{
	//이벤트 등록이 된 경우만 구현되도록 
	if(this.dblclickBind)
	{
		var thisObj = this;

		$(itemEle).dblclick(function(e)
		{
			//test comment 트리 접고 펴는 로직
			var btn = $(this).children('.tree-expand');
			btn.click();

			thisObj.acomp.reportEvent('dblclick', this, e);
			
			return false;
			
		});
	}
};

ATreeEvent.prototype.onKeyDown = function(e)
{
	if(this.acomp===AComponent.getFocusComp())
	{
		this.acomp._keyDownManage(e);
		this.acomp.reportEvent('keydown', null, e);
	}
};

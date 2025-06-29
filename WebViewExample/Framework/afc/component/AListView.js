              
/**
 * @author asoocool
 * 
 */

class AListView extends AComponent
{
	constructor()
	{
		super()
	
		this.delegator = null;

		this.itemHeight = null;
		//this.selectBgColor = '#0000d0';
		this.dividerColor = null;
		this.selectClass = null;
		this.selectItem = null;

		this.scrollArea = null;
		this.itemWrapper = null;	//item 을 담을 div, flex 속성을 사용한다.

		this.scrollComp = null;

		this.scrlManager = null;
		//스크롤 위치를 복원하기 위해 저장해둠.
		this.savedScrollPos = -1;

		this.defaultUrl = '';

		this.realMap = null;
		this.realField = null;
	}

    _includeView(view, inx)
    {
        this.addItem(view, [inx])
    }
	
}

window.AListView = AListView

//####################################################################
//	style="height: 60px;" --> attribute 에서 정보를 참조하기 위해 필요

AListView.CONTEXT = 
{
    tag: '<div data-base="AListView" data-class="AListView" class="AListView-Style" data-selectable="true">'+
            '<div class="listview-row" style="height: 60px;"></div><div class="listview-row AListView-select" style="height: 60px;"></div>'+ 
			'<div class="listview-row" style="height: 60px;"></div><div class="listview-row" style="height: 60px;"></div></div>',

    defStyle: 
    {
        width:'380px', height:'270px'
    },

    events: ['select', 'scroll', 'scrolltop', 'scrollbottom', 'drop', 'refresh']
};

AListView.prototype.beforeInit = function()
{
	//---------------------------------------------------------------
	//	이벤트 구현시 필요하므로 init 전에 변수를 만들어 두어야 한다.
	
	//this.scrollArea = $('<div style="position:absolute; width:100%; height:100%; overflow:auto;"></div>');
	this.scrollArea = $('<div style="position:relative; z-index:0; width:100%; height:100%; overflow:auto; -webkit-overflow-scrolling:touch;"></div>');
	
	//------------------------------------------------------------------
	
	this.itemWrapper = $('<div class="list_item_wrapper"></div>');
	
	/*	이렇게 하면 작동 안 함.	
	this.itemWrapper.css(
	{
		'display': 'flex',
		'display': '-ms-flexbox'
	});
	*/
	this.itemWrapper.css('display', 'flex');
	this.itemWrapper.css('display', '-ms-flexbox');

	const gap = this.getAttr('item-gap');
	if(gap) this.itemWrapper.css('gap', gap);
	
	this.scrollArea.append(this.itemWrapper);
};

AListView.prototype.init = function(context, evtListener)
{
	/*
	//---------------------------------------------------------------
	//	이벤트 구현시 필요하므로 init 전에 변수를 만들어 두어야 한다.
		//this.scrollArea = $('<div style="position:absolute; width:100%; height:100%; overflow:auto;"></div>');
		this.scrollArea = $('<div style="position:relative; z-index:0; width:100%; height:100%; overflow:auto; -webkit-overflow-scrolling:touch;"></div>');
	//------------------------------------------------------------------
	*/

    AComponent.prototype.init.call(this, context, evtListener);
	
	//리스트뷰 기본 옵션
	this.setOption(
	{
    	//isViewPool: false,
        isSelectable: this.getAttr('data-selectable'),			//선택 [불]가능 옵션 플래그
    	isUpdatePosition: this.getAttr('data-update-position'),	//생성시점에 updatePosition 을 호출할 지, 리스트 뷰는 성능을 위해 기본적으로 updatePosition 이 호출되지 않도록 한다.
    	isWrap: this.getAttr('data-wrap'), 						//가로로 배치하다 공간이 없으면 개행하여 다시 추가, 주의 가로 스크롤 기능이 아님
		direction: this.getAttr('data-direction'),				//스크롤 방향
		isCheckUpdatePos: false									//리사이즈 시점에 업데이트 여부를 체크하여 updatePosition 을 호출할 지 여부
		
    }, true);
	
	
	var items = this.$ele.children();

	if(this.option.direction=='horizontal')
	{
		this.itemWrapper.css(
		{
			'flex-direction': 'row',
            'align-items': 'stretch',
			'-ms-flex-direction': 'row',
			'height': '100%'
		});
	}
	else
	{
		this.itemWrapper.css(
		{
			'flex-direction': 'column',
            'align-items': 'stretch',
			'-ms-flex-direction': 'column',
			'width': '100%'
		});
	}
	
	//wrapping, 가로로 배치하다 공간이 없으면 개행하여 다시 추가
	//세로 스크롤 발생
	if(this.option.isWrap && this.option.direction=='horizontal') 
	{
		this.itemWrapper.css(
		{
			'flex-wrap': 'wrap',
			'align-content': 'flex-start',
			'-ms-flex-wrap': 'wrap',
			'-ms-flex-line-pack': 'start'
		});
	}
	
	//wrap 옵션이 없는 경우만 item height 값이 유효함. 즉, wrap 이 참이면 서브뷰는 fullview 옵션을 끄고 넓이, 높이를 px 로 직접 지정해야 한다.
	//개발시점의 설정값은 height 에 셋팅되어져 있으므로 가로모드여도 height 값으로 얻는다.
	else this.itemHeight = items[0].style.height;

    //console.log(' -- ', this.itemHeight)

	
	var selClass = this.getAttr('data-style-selectitem', 'AListView-select');
	
    this.setSelectClass(selClass);
	this.setDefaultUrl(this.getAttr('data-default-url'));
    
	//개발 시점
	if(this.isDev())
	{
		this.$ele.addClass('listview-dev');
	}
	//실행 시점
	else 
	{
		//RefreshIndicator 가 init 시점에 추가되므로 (scrollArea 와 같은 레벨로 추가되야하므로) 제거할 항목만 제거한다.
		//또한 엘리먼트 순서가 중요하므로 prepend 하여 넣는다.
		this.$ele.children('.listview-row').remove();
		this.$ele.prepend(this.scrollArea);
		
		var itemInfos = this.getMultiAttrInfo('data-iteminfo-'), arr = [], tmp, key, inx;
		
		if(itemInfos)
		{
			//key is attr key, 순서대로 추가하기 위해
			for(key in itemInfos)
			{
				tmp = itemInfos[key].split(',');	//index, url, itemId

				inx = Number(tmp[0]);
				arr[inx] = tmp[1];
			}

			for(inx in arr)
			{
				this.addItem(arr[inx], ['']);
			}
		}
	}
    
    //this.escapePreventTouch();
	
	//this.setScrollArrow();
	
	//this.createBackup(50, 20);
	
	if(afc.isScrollIndicator) this._enableScrollIndicator();
};

AListView.prototype.setItemHeight = function(height)
{
	this.itemHeight = height;
};


AListView.prototype.setDefaultUrl = function(url)
{
	this.defaultUrl = url;
};


AListView.prototype.getDefaultUrl = function()
{
	return this.defaultUrl;
};

AListView.prototype._callSubActiveEvent = function(funcName, isFirst)
{
	if(this.option.isUpdatePosition)
	{
	    this.getItems().each(function()
	    {
	    	this.view[funcName](isFirst);
	    });
	}
	//var selView = this.getSelectedView();
	//if(selView) selView[funcName](isFirst);
};


AListView.prototype.enableScrlManager = function()
{
	if(this.scrlManager) return this.scrlManager;
	
	this.scrlManager = new ScrollManager();
	
	//this.$ele.css('-webkit-overflow-scrolling', '');
	this.scrollArea.css('-webkit-overflow-scrolling', '');
	
	this.scrollImplement();
	
	this.aevent._scroll();
	
	return this.scrlManager;
};

AListView.prototype.setScrollComp = function(acomp)
{
	this.scrollComp = acomp;
	
};

/*
AListView.prototype.setOption = function(option)
{
    for(var p in option)
    {
    	if(!option.hasOwnProperty(p) || this.option[p]==undefined) continue;
    	
        this.option[p] = option[p];
    }
};
*/

AListView.prototype.scrollImplement = function()
{
	var thisObj = this;
	//PC인 경우 자신의 영역 mousedown 과 상관없이 mousemove 가 무조건 발생한다.
	var isDown = false;
	
	
	var scrlArea = this.scrollArea[0], transTop;
	
	AEvent.bindEvent(scrlArea, AEvent.ACTION_DOWN, function(e)
	{
		isDown = true;
		
		//e.preventDefault();
		
		thisObj.scrlManager.initScroll(e.changedTouches[0].clientY);
		
		if(thisObj.scrollComp)
			transTop = thisObj.scrollComp.getPos().top + scrlArea.scrollTop;
	});
	
	AEvent.bindEvent(scrlArea, AEvent.ACTION_MOVE, function(e)
	{
		if(!isDown) return;
		
		e.preventDefault();
		
		thisObj.scrlManager.updateScroll(e.changedTouches[0].clientY, _scrlHelper);
	});
	
	AEvent.bindEvent(scrlArea, AEvent.ACTION_UP, function(e)
	{
		if(!isDown) return;
		isDown = false;
		
		//e.preventDefault();
		
		thisObj.scrlManager.scrollCheck(e.changedTouches[0].clientY, _scrlHelper);
	});
	
	function _scrlHelper(move)
	{
		if(move==0) return true;
		
		var oldTop = scrlArea.scrollTop;

		//scrollComp 는 css 값을 셋팅하기 때문에 똑같이 맞춰주기 위해 소수점을 버림.
		if(thisObj.scrollComp) move = parseInt(move);
		
		scrlArea.scrollTop += move;

		if(oldTop==scrlArea.scrollTop) return false;
		
		if(thisObj.scrollComp)
		{
			thisObj.scrollComp.setStyle('top', (transTop-scrlArea.scrollTop)+'px');
		}
		
		return true;
	}
	
	
};

AListView.prototype.setScrollArrow = function(topHeight)
{
	var sa = new ScrollArrow();
	sa.setArrow('vertical');
	//sa.apply(this.element);
	sa.apply(this.scrollArea[0]);
	
	if(topHeight) sa.arrow1.css('top', topHeight+'px');
};


AListView.prototype._enableScrollIndicator = function()
{
	this.scrlIndicator = new ScrollIndicator();
	
	var type = 'vertical';
	
	//가로 방향이고 랩 옵션이 없는 경우만 가로 스크롤이 발생
	if(this.option.direction=='horizontal' && !this.option.isWrap) type = 'horizontal';
		
	this.scrlIndicator.init(type, this.scrollArea[0]);
};


AListView.prototype.scrollTopManage = function()
{
	if(this.scrlManager) this.scrlManager.stopScrollTimer();

	if(this.bkManager && this.bkManager.checkHeadBackup()) 
	{
		if(this.bkManager.isMoveReal()) this.scrollToTop();
		
		return false;
	}
	else return true;
};

AListView.prototype.scrollBottomManage = function()
{
	if(this.scrlManager) this.scrlManager.stopScrollTimer();

	if(this.bkManager && this.bkManager.checkTailBackup()) 
	{
		if(this.bkManager.isMoveReal()) this.scrollToBottom();
		
		return false;
	}
	else return true;
};


//----------------------------------------------------------
//  delegate functions
//  function bindData(item, data, alistview);
//  function itemState(item, isSelect, alistview);
//----------------------------------------------------------
AListView.prototype.setDelegator = function(delegator)
{
    this.delegator = delegator;
};

/*
AListView.prototype.setSelectBgColor = function(selectBgColor)
{
    this.selectBgColor = selectBgColor;
};
*/

AListView.prototype.setSelectClass = function(selectClass)
{
    this.selectClass = selectClass;
};

AListView.prototype.setDividerColor = function(color)
{
	this.dividerColor = color;
};


//데이터 매칭은 bindData 에서 처리된다.
//dataArray 는 배열이다. asyncCallback 은 boolean 이나 function 이 올 수 있다.
AListView.prototype.insertItem = async function(url, dataArray, posItem, isPrepend, itemHeight)//, asyncCallback)
{
	var newItems = null, thisObj = this;
	
	newItems = await this.createItems(url, dataArray, posItem, isPrepend, itemHeight);
		
	//this.aevent._select($(newItems));
	
	return newItems;
};


//리스트뷰 항목 많을 때 느려지는 이유 AButton 등 컴포넌트의 init 에서 시간이 걸림 
//특히... defaultAction 내의 _click, _keydown 등 이벤트 함수 구현에서 시간이 걸림
//많이 추가해야 하는 경우는 리스트뷰 대신 그리드 사용하기
//그리드 내에 컴포넌트가 필요하다면 layComponent 보다... rowTmpl 내의 태그 수정(UI 에서 Edit As HTML) 사용하기 

//insertItem 이 Promise 를 리턴
AListView.prototype.addItem = async function(url, dataArray, isPrepend, itemHeight)//, asyncCallback)
{
	var newItems = await this.insertItem(url, dataArray, null, isPrepend, itemHeight);//, asyncCallback);
	
	return newItems;
};

//여러개의 url 을 동시에 추가한다. 단, urlArr 과 dataArr 은 1:1 로 매칭된다.
AListView.prototype.addItems = async function(urlArr, dataArr, isPrepend, itemHeight)//, asyncCallback)
{
	var urlLen = urlArr.length, newItems = [], items;
	
	for(var i=0; i<urlArr.length; i++)
	{
		items = await this.addItem(urlArr[i], [ dataArr[i] ], isPrepend, itemHeight);
		newItems.push(items[0]);
	}
	
	return newItems;
};

/*
AListView.prototype.setSelectItem = function(item)
{
    if(this.delegator && this.delegator.itemState)
    {
        if(this.selectItem) this.delegator.itemState(this.selectItem, false, this);
    
        this.selectItem = item;
        if(this.selectItem) this.delegator.itemState(this.selectItem, true, this);
    }
    else
    {
        if(this.selectItem)
        {
            $(this.selectItem).css('background-color', '');
            if(this.selectClass) $(this.selectItem).removeClass(this.selectClass); 
        } 
        
        this.selectItem = item;
        if(this.selectItem)
        { 
            $(this.selectItem).css('background-color', this.selectBgColor);
            if(this.selectClass) $(this.selectItem).addClass(this.selectClass);
        }
    }
};
*/

AListView.prototype.setSelectItem = function(item)
{
    if(this.selectItem)
    {
	    if(this.delegator && this.delegator.itemState)
	        this.delegator.itemState(this.selectItem, false, this);
    	
        //if(this.selectClass) $(this.selectItem).removeClass(this.selectClass); 
		
		if(this.selectClass) this.selectItem.view.$ele.removeClass(this.selectClass); 
    } 
    
    this.selectItem = item;
    if(this.selectItem)
    { 
    	if(this.delegator && this.delegator.itemState)
    		this.delegator.itemState(this.selectItem, true, this);
    	
        //if(this.selectClass) $(this.selectItem).addClass(this.selectClass);
		
		if(this.selectClass && this.selectItem.view.$ele) 
            this.selectItem.view.$ele.addClass(this.selectClass);
    }
};

AListView.prototype.getSelectItem = function()
{
    return this.selectItem;
};

AListView.prototype.getFirstItem = function()
{
    return this.getItems()[0];
};

AListView.prototype.getLastItem = function()
{
    var items = this.itemWrapper.children();
	
	if(items.length==0) return null;
	else return items[items.length - 1];
};

AListView.prototype.getItem = function(index)
{
    return this.getItems()[index];
};

AListView.prototype.getItems = function()
{
    return this.itemWrapper.children();
};

AListView.prototype.getItemCount = function()
{
    return this.itemWrapper.children().length;
};

/*
AListView.prototype.getLastItem = function()
{
    var items = this.scrollArea.children();
	
	if(items.length==0) return null;
	else return items[items.length - 1];
};

AListView.prototype.getItem = function(index)
{
    return this.getItems()[index];
};

AListView.prototype.getItems = function()
{
    return this.scrollArea.children();
};

AListView.prototype.getItemCount = function()
{
    return this.scrollArea.children().length;
};
*/

/*
AListView.prototype.indexOfItem_backup = function(item)
{
	if(this.bkManager) 
	{
		var inx = this.getItems().index(item);
		if(inx<0) return inx;
		else return inx + this.bkManager.getHeadCount();
	}

	else return this.getItems().index(item);
};
*/

AListView.prototype.indexOfItem = function(item)
{
	return this.getItems().index(item);
};

AListView.prototype.removeItem = function(item)
{
	//async 로 addItem이 되고 view가 item이 세팅되기전에 제거되는 경우의 체크
	if(item.view) item.view.removeFromView();

    if(item===this.selectItem) this.selectItem = null;
    
    $(item).remove();
};

AListView.prototype.removeItemByIndex = function(index)
{
    var item = this.getItems()[index];
    this.removeItem(item);
    //this.getItems().eq(index).remove();
};

AListView.prototype.removeAllItems = function()
{
    this.getItems().each(function()
    {
		//async 로 addItem이 되고 view가 item이 세팅되기전에 제거되는 경우의 체크
    	if(this.view) this.view.removeFromView();
			
    	$(this).remove();
    });
	
	if(this.bkManager) this.bkManager.clearAll();
	
	this.selectItem = null;
	
	if(afc.andVer<4.4) this.refreshListView();
};

//	* example *
//	var userId = 'asoosoft';
//
//	var item = listView.findItem(function(data)
//	{
//		return (data.userId==userId);
//	});
//
//	listView.removeItem(item);

AListView.prototype.findItem = function(findFunc)
{
	var retItem = null;
	
	this.getItems().each(function()
	{
		if(findFunc(this.itemData))
		{
			retItem = this;
			return false;
		}
	});
	
	return retItem;
};

AListView.prototype.refreshListView = function()
{
	this.scrollArea.hide();
	var thisObj = this;
	setTimeout(function(){ thisObj.scrollArea.show(); }, 1);
};

AListView.prototype.scrollTo = function(pos, isAni)
{
	if(isAni) 
	{
		var aniObj = {};
		
		if(this.option.direction=='horizontal') aniObj.scrollLeft = pos;
		else aniObj.scrollTop = pos;

		this.scrollArea.stop().animate(aniObj, 100, 'swing');
	}
	else
	{
		if(this.option.direction=='horizontal') this.scrollArea[0].scrollLeft = pos;
		else this.scrollArea[0].scrollTop = pos;
	}
};

AListView.prototype.scrollOffset = function(offset, isAni)
{
	var scrlVal = 0;
	if(this.option.direction=='horizontal') scrlVal = this.scrollArea[0].scrollLeft + offset;
	else scrlVal = this.scrollArea[0].scrollTop + offset;
	
	//this.scrollArea[0].scrollTop += offset;
	
	this.scrollTo(scrlVal, isAni);
};

AListView.prototype.scrollToTop = function(isAni)
{
    //this.scrollArea[0].scrollTop = this.scrollArea[0].scrollHeight*-1;
	//this.scrollArea[0].scrollTop = 0;
	
	if(this.bkManager) this.bkManager.setMoveReal(true);
	
	this.scrollTo(0, isAni);
};

AListView.prototype.scrollToBottom = function(isAni)
{
    //this.scrollArea[0].scrollTop = this.scrollArea[0].scrollHeight;
	
	if(this.bkManager) this.bkManager.setMoveReal(true);
	
	this.scrollTo(this.scrollArea[0].scrollHeight, isAni);
};

AListView.prototype.getScrollPos = function()
{
    return this.scrollArea[0].scrollTop;
};

AListView.prototype.saveScrollPos = function()
{
    this.savedScrollPos = this.scrollArea[0].scrollTop;
};

AListView.prototype.restoreScrollPos = function()
{
    if(this.savedScrollPos!=-1) 
    {
        this.scrollArea[0].scrollTop = this.savedScrollPos;
        this.savedScrollPos = -1;
    }
};

AListView.prototype.setScrollAreaId = function(areaId)
{
	if(!areaId) areaId = this.getElementId() + '_scrl';
	
	this.scrollArea.attr('id', areaId);
};

AListView.prototype.createItems = async function(url, dataArray, posItem, isPrepend, itemHeight)//, asyncCallback)
{
    var thisObj = this, $item, item, aview, newItems = [];
	
	if(!url) 
	{
		if(!this.defaultUrl) return newItems;
		
		url = this.defaultUrl;
	}
	
	var dataLen = dataArray.length;
    
    //요청한 개수만큼 생성한다.
    for(var i=0; i<dataLen; i++)
    {
        $item = $('<div></div>');
        item = $item[0]; 

        //$item.css('background-color', this.normalBgColor);
        
        //구분선 색을 추가했으면 구분선색 표현
        if(this.dividerColor) 
		{
			if(this.option.direction=='horizontal') $item.css('border-right', '1px solid '+this.dividerColor);
			else $item.css('border-bottom', '1px solid '+this.dividerColor);
		}
        
		//this.itemInsertManage(item, posItem, isPrepend);
		
        item.itemData = dataArray[i];
        
        newItems.push(item);

        /*
		if(i==0) aview = await AView.createView(item, url, this, null, !this.option.isUpdatePosition);

		//두번째 아이템부터는 마지막 로드된 html string 으로 뷰를 생성한다.
		//else aview = await AView.createView(item, url, this, null, !this.option.isUpdatePosition, null, null, AView.lastLoadedHtml);
		else aview = await AView.createView(item, url, this, null, !this.option.isUpdatePosition, null, null, this.lastLoadedHtml);
        */

        if(typeof(url)=='string') 
        {
            if(i==0) aview = await AView.createView(item, url, this, null, !this.option.isUpdatePosition);

            //두번째 아이템부터는 마지막 로드된 html string 으로 뷰를 생성한다.
            else aview = await AView.createView(item, url, this, null, !this.option.isUpdatePosition, null, null, this.lastLoadedHtml);
        }
	    else 
        {
            aview = url
            AView.setViewInItem(aview, item, this)
        }

		this._afterCreated(aview, itemHeight);
    }
	
	this.itemInsertManage(newItems, posItem, isPrepend);

    return newItems;
};

AListView.prototype._afterCreated = function(aview, itemHeight)
{
	if(!aview || !aview.isValid()) return;

    if(itemHeight)
    {
        aview._item.style['flex-basis'] = itemHeight;
    }
	
	//this.itemHeight 가 auto 이면 로드되는 뷰의 높이만큼 자동으로 아이템의 높이가 늘어난다.
	//단, 로드되는 뷰의 height 값을 명확히 px 단위로 지정해야 한다. 퍼센트(ex, 100%)로 지정하면 나오지 않는다.
	//뷰의 height 를 퍼센트로 지정했다면 itemHeight 를 명확히 지정해야 한다.
	else if(this.itemHeight) 
	{
		//if(this.option.direction=='horizontal') aview.$ele.css('width', this.itemHeight);
		//else aview.$ele.css('height', this.itemHeight);

		aview._item.style['flex-basis'] = this.itemHeight;
	}

	if(this.delegator) this.delegator.bindData(aview._item, aview._item.itemData, this);

	//델리게이터를 셋팅하지 않으면 기본적으로 서브뷰의 setData 를 호출해 준다.
	else if(aview.setData) aview.setData(aview._item.itemData);

    /* 부하를 주므로 삭제
	if(this.bkManager) 
	{
		this.bkManager.setItemHeight(aview.getHeight());
	}
    */
};


AListView.prototype.updatePosition = function(pWidth, pHeight)
{
    AComponent.prototype.updatePosition.call(this, pWidth, pHeight);
	
	var isUpdate = this.option.isUpdatePosition;

    if(isUpdate || this.option.isCheckUpdatePos)
    {
    	this.getItems().each(function()
    	{
        	if(this.view && (isUpdate || this.view.isUpdatePosFromListView) )
				this.view.updatePosition();
    	});
    }
};

//다른 컴포넌트에 있는 아이템이 이동하며 추가될 수도 있다.
//item 은 배열이 될 수도 있다.
AListView.prototype.itemInsertManage = function(items, posItem, isPrepend, isOuterItem)
{
	//다른 리스트뷰에서 이동될 수도 있으므로 owner 를 자신으로 셋팅해 준다.
	if(isOuterItem)
	{
		$(items).each(function(ele)
		{
			if(ele.view) ele.view.owner = this;
		});
	}

	if(posItem)
	{
		if(isPrepend) $(items).insertBefore(posItem);
		else $(items).insertAfter(posItem);
	}
	else
	{
		if(isPrepend) 
		{
			if(this.bkManager && this.bkManager.prependItemManage($(items)) ) return;
		
			//this.scrollArea.prepend(items);
			this.itemWrapper.prepend(items);
		}
		else 
		{
			if(this.bkManager && this.bkManager.appendItemManage($(items)) ) return;
			
			//this.scrollArea.append(items);
			this.itemWrapper.append(items);
		}
	}
};

AListView.prototype.moveTopItems = function(items)
{
	for(var i = items.length-1; i>=0; i--)
	{
		this.itemInsertManage(items[i], null, true);
	}
};

AListView.prototype.moveBottomItems = function(items)
{
	for(var i = 0; i<items.length; i++)
	{
		this.itemInsertManage(items[i], null, false);
	}
};

AListView.prototype.moveUpItems = function(items)
{
	var itemsLen = items.length;
	for(var i = 0; i<itemsLen; i++)
	{
		var index = this.indexOfItem(items[i])-1;
		if(index > -1)
		{
			var preItem = this.getItem(index);
			if(preItem === items[i-1]) continue;
			else this.itemInsertManage(items[i], preItem, true);
		}
	}
};

AListView.prototype.moveDownItems = function(items)
{
	var itemsLen = this.getItems().length;
	for(var i = items.length-1; i>=0; i--)
	{
		var index = this.indexOfItem(items[i])+1;
		var nextItem = this.getItem(index);
		if(itemsLen > index)
		{
			if(nextItem === items[i+1]) continue;
			else this.itemInsertManage(items[i], nextItem, false);
		}
	}
};

AListView.prototype.isMoreScrollTop = function()
{
	if(this.scrollArea[0].scrollTop > 0) return true;
	else return false;	
};

AListView.prototype.isMoreScrollBottom = function()
{
	if(this.scrollArea[0].offsetHeight + this.scrollArea[0].scrollTop < this.scrollArea[0].scrollHeight) return true;
	else return false;	
};

AListView.prototype.isMoreScrollLeft = function()
{
	if(this.scrollArea[0].scrollLeft > 0) return true;
	else return false;	
};

AListView.prototype.isMoreScrollRight = function()
{
	if(this.scrollArea[0].offsetWidth + this.scrollArea[0].scrollLeft < this.scrollArea[0].scrollWidth) return true;
	else return false;	
};

AListView.prototype.isScroll = function()
{
    return (this.scrollArea[0].offsetHeight < this.scrollArea[0].scrollHeight) || (this.scrollArea[0].offsetWidth < this.scrollArea[0].scrollWidth);
};

AListView.prototype.removeFromView = function(onlyRelease)
{
	this.removeAllItems();
	
	AComponent.prototype.removeFromView.call(this, onlyRelease);
};

//-----------------------------------------------------
// About Backup

AListView.prototype.createBackup = function(maxRow, restoreCount)
{
	if(afc.isIos) return;
	
	//if(!window['BackupManager']) return;
	
	this.destroyBackup();

	this.bkManager = new BackupManager();
	this.bkManager.create(this, maxRow, restoreCount);
	//this.bkManager.setBackupInfo(this.itemHeight, 1, this.scrollArea[0], this.scrollArea);

    //백업매니저를 사용할 경우는 명확히 아이템 사이즈를 지정해 줘야 한다.(ex, '60px')
	this.bkManager.setBackupInfo(parseInt(this.itemHeight), 1, this.scrollArea[0], this.itemWrapper);
	
	this.aevent._scroll();
	
	//ios must enable scrollManager in backup
	if(afc.isIos) this.enableScrlManager();
};

AListView.prototype.destroyBackup = function()
{
	if(this.bkManager)
	{
		this.bkManager.destroy();
		this.bkManager = null;
	}
};

//-----------------------------------------------------
//	BackupManager delegate function

AListView.prototype.getTopItem = function()
{
	return this.getFirstItem();
};

AListView.prototype.getBottomItem = function()
{
	return this.getLastItem();
};

AListView.prototype.getTotalCount = function()
{
	return this.getItemCount();
};

//--------------------------------------------------------------


AListView.prototype.setRealMap = function(realField)
{
	this.realField = realField;
	this.realMap = null;
};

AListView.prototype.getRealKey = function(data)
{
	return data[this.realField];
};

AListView.prototype.setData = async function(dataArr)
{
	this.removeAllItems();
	
	var items = await this.addItem(null, dataArr);
	
	for(var i=0; i<items.length; i++)
	{
		items[i].view.setData(dataArr[i]);
	}
};

AListView.prototype.getData = function()
{
	var ret = [];
	this.getItems().each(function()
	{
		ret.push(this.view.getData());
	});
	return ret;
};

//ListView는 outblock 에 더미필드를 셋팅해야 이 함수가 호출된다.
AListView.prototype.setQueryData = function(dataArr, keyArr, queryData)
{
	if(queryData.isReal)
	{
		var realType = queryData.getRealType(this);
		
		//기존 버전도 동작하도록, 차후에 제거하도록
		if(realType == undefined) realType = this.updateType;
		
		this.doRealPattern(dataArr, keyArr, queryData, realType);
	}
	else this.doAddPattern(dataArr, keyArr, queryData);
};

AListView.prototype.doRealPattern = async function(dataArr, keyArr, queryData, realType)
{
	var item;
	
	//리얼은 원소가 하나인 배열만 온다.
	//data = dataArr[0];
	

	//update
	if(realType==0)
	{
		item = this.realMap[this.getRealKey(dataArr[0])];
		
		if(!item) return;
		
		item.view.updateChildMappingComp(dataArr, queryData);
		
		item.itemData = dataArr[0];
	}
	
	else if(realType==2)
	{
		var realKey = this.getRealKey(dataArr[0]);
		item = this.realMap[realKey];
		
		if(!item) return;
		
		this.removeItem(item);
		
		delete this.realMap[realKey];
	}
	
	//insert
	else
	{
		item = await this.addItem(null, dataArr, (this.updateType==-1) )[0];
		item.view.updateChildMappingComp(dataArr, queryData);
	}
};

AListView.prototype.doAddPattern = async function(dataArr, keyArr, queryData)
{
	//조회하는 경우 기존의 맵 정보를 지운다.
	if(this.realField!=null) this.realMap = {};

	var items = await this.addItem(null, dataArr), data;
	
	for(var i=0; i<items.length; i++)
	{
		data = dataArr[i];
		
		items[i].view.updateChildMappingComp([data], queryData);
		
		//리얼맵이 활성화 되어 있으면 조회 시점에 리얼맵을 만든다.
		if(this.realField!=null) 
		{
			this.realMap[this.getRealKey(data)] = items[i];
		}
		
	}
};



AListView.prototype._getDataStyleObj = function()
{
	var ret = AComponent.prototype._getDataStyleObj.call(this);
		
	var val = this.getAttr('data-style-selectitem');

	//attr value 에 null 이나 undefined 가 들어가지 않도록
	ret['data-style-selectitem'] = val ? val : '';
	
	return ret;
};

// object 형식의 css class 값을 컴포넌트에 셋팅한다.
// default style 값만 셋팅한다.
AListView.prototype._setDataStyleObj = function(styleObj)
{
	for(var p in styleObj)
	{
		if(p==afc.ATTR_STYLE) this._set_class_helper(this.$ele, null, styleObj, p);
		
		else if(p=='data-style-selectitem') this._set_class_helper(this.$ele, this.$ele.find('.AListView-select'), styleObj, p);
	}
};


//AListView 의 enableScrlManager 가 호출 되어졌고 스크롤 가능 영역에 추가되어져 있을 경우
//스크롤이 끝나고(ex, scrollBottom) 상위 스크롤이 연속적으로 발생되도록 하려면
//상위 스크롤은 enableScrlManager 가 호출되어져야 하고 자신은 overscrollBehavior 함수를 호출해야 한다.
AListView.prototype.overscrollBehavior = function(disableScrlManager)
{
	if(!this.scrlManager) return;

	var thisObj = this, oldScrollTop, 
		scrlArea = this.scrollArea[0], startY = 0, isTouchLeave = false, isRemove = true;

	//touch start
	AEvent.bindEvent(this.element, AEvent.ACTION_DOWN, function(e)
	{
		if(isRemove)
		{
			isRemove = false;
			
			thisObj.scrlManager.addDisableManager(disableScrlManager);
		}
		
		oldScrollTop = scrlArea.scrollTop;
		
		startY = e.changedTouches[0].clientY;
		
		isTouchLeave = false;
	});
	
	AEvent.bindEvent(this.element, AEvent.ACTION_MOVE, function(e)
	{
		if(isTouchLeave) return;
		
		if(Math.abs(e.changedTouches[0].clientY - startY) >= disableScrlManager.option.moveDelay) 
		{
			isTouchLeave = true;

			//터치 이후 스크롤의 변화가 없으면 상위 스크롤이 작동되도록 해줌.
			if(oldScrollTop==scrlArea.scrollTop)
			{
				isRemove = true;

				thisObj.scrlManager.removeDisableManager(disableScrlManager);
			}
		}
	});
	
};



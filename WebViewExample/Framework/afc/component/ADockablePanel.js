(async function(){


await afc.import("Framework/afc/component/APanel.js");



/**
Constructor
Do not call Function in Constructor.
*/
ADockablePanel = class ADockablePanel extends APanel
{
	constructor(containerId)
	{
		super(containerId)
	
		this.dockDir = 'column';
	}

	
	
	
}

//window.ADockablePanel = ADockablePanel

//-------------------------------------------------------------------------
//	static area

//-------------------------------------------------------------------------

ADockablePanel.prototype.init = function(context)
{
	APanel.prototype.init.call(this, context);
	
	var thisObj = this;
		
	this.$ele.droppable(
	{
		//accept: '.AContainer-Style',
		scope: '_docking_drag_drop_',
		drop: function(event, ui)
		{
			//도킹되어져 있는 상황에서 언독시키는 경우이다.
			var acont = ui.draggable[0].acont;
            if(acont.dockedCntr) 
            {
                //도킹되기 이전의 창 사이즈로 복원
                var pos = ADockingFrame.getFramePosition(acont.getContainerId());
                acont.dockedCntr.undockFrame(acont, ui.position.left, ui.position.top, pos.width, pos.height);
            }
		}
	});

};

ADockablePanel.prototype.setDockDirection = function(dir)
{
	this.dockDir = dir;
};

//deletor function
//onDockFrame(acomp, frame, tabPanel)
//onUndockFrame(acomp, frame, tabPanel)
ADockablePanel.prototype.setDelegator = function(delegator)
{
	this.delegator = delegator;
};

//pos : -1, 0, 1 --> -1:insert before, 0:assign, 1:insert after
//pos 가 0 일 경우 기존 자리에 들어가므로 dockSize 를 입력할 필요가 없다.
//이 경우 새로운 탭이 하나 추가된다.
ADockablePanel.prototype.dockFrame = function(frame, inx, pos, dockSize)
{
	//도킹으로 전환되기 바로 이전 정보를 저장해 둔다.		
	ADockingFrame.setFramePosition(frame.getContainerId(), frame.getPositionInfo());
	//----------------------------------------------------------------------------------
	
	this._saveUndockParent(frame);

	var tabPanel = null, 
		isInsert = (pos!=0);	//추가 삽입 도킹
	
	//최초 도킹하는 경우
	if(!this.splitter)
	{
		isInsert = true;
		
		if(!dockSize) dockSize = 250;
		
		//이후 컨테이너에 상하 또는 좌우로 윈도우가 도킹 가능하도록 1개로 스플릿한다.
		tabPanel = this.createSplit(1, [-1], this.dockDir)[0];
		
		//사이즈가 0이면 복원한다.
		var tmpc = this.getParent(),
			tinx = tmpc.indexOfPanel(this);
		
		if(tmpc.splitter.getSplitSize(tinx)==0)
			tmpc.splitter.setSplitSize(tinx, dockSize);
	}
	
	//이후 추가적인 도킹
	else
	{
		//특정 tabPanel 에(즉, 같은 위치에) 도킹하는 경우
		if(!isInsert) 
		{
			tabPanel = this.getSplitPanel(inx);
			
			if(tabPanel) tabPanel.splitter.setSplitSize(1, 20);	//같은 tabPanel 에 두개이상 도킹 될 경우 탭바를 보여준다.
			
			//insert 가 아니어도 tabPanel 을 못 찾으면 바로 앞 컨테이너의 after insert 로 처리한다.
			else 
			{
				inx--;
				pos = 1;
				isInsert = true;
			}
		}
		
		//새롭게 스플릿하여 밑으로 도킹하는 경우
		if(!tabPanel)
		{
			tabPanel = this.insertSplit(inx, dockSize, (pos==1) );	//-1 : insertBefore, 1 : insertAfter
			
            //마지막 추가된 패널의 auto 계산이 완료된 후
            //auto(-1) 셋팅을 해제하기 위해 자신의 실제 사이즈로 변경한다.
            var realSize = this.splitter.getSplitSize(-1);
			this.splitter.setSplitSize(-1, realSize);
		}
	}

	//insert 인 경우...
	if(isInsert)
	{
		//컨테이너에 tabbar 를 추가하기 위해....스플릿, barSize 는 0.
		tabPanel.createSplit(2, [-1, 0], 'column', 0);

		//툴바 생성	-------------------------------------
		tabPanel.tabBar = new ATabBar();
		//temp code
		tabPanel.tabBar.option.isCloseBtn = false;
		tabPanel.tabBar.option.isIcon = false;
		tabPanel.tabBar.option.isTabWrap = false;
		//------------------------------------
		tabPanel.tabBar.init();
		tabPanel.getSplitPanel(1).setView(tabPanel.tabBar);
		//----------------------------------------------
	}
	
	var thisObj = this;

	tabPanel.$ele.droppable(
	{
		tolerance: 'pointer',
		scope: '_docking_drag_drop_',
		over: function(event, ui) 
		{
			$(this).addClass('layout_dnd_hover_border'); 
		},
		out: function(event, ui) 
		{ 
			$(this).removeClass('layout_dnd_hover_border'); 
		},
		drop: function(event, ui)
		{
			$(this).removeClass('layout_dnd_hover_border');
			
			setTimeout(function()
			{
				var acont = ui.draggable[0].acont;
				if(acont.dockedCntr) acont.dockedCntr.undockFrame(acont, 0, 0, 0, 0);
			
				var dropInx = thisObj.indexOfPanel(tabPanel);
				thisObj.dockFrame(acont, dropInx, 0);
			}, 0);
		}
	});


	//실제 도킹 작업을 하는 것은 이 부분.
	frame.setParent(tabPanel.getSplitPanel(0), { left: '0px', top: '0px', width: '100%', height: '100%' });
	//frame.onResize(); --> setParent 내부에서 호출됨

	//도킹될 경우 리사이즈 기능 off
	frame.setResizeOption('disabled', true);
	frame.dockedCntr = this;

	var cntrId = frame.getContainerId();
	tabPanel.tabBar.addTab(cntrId, frame.getTitleText(), frame);
	tabPanel.tabBar.selectTabById(cntrId);
	
	//---------------------------------------------------------------------
	//	undock 을 위한 draggable 셋팅
	frame.setDragOption('distance', 20);
	frame.setDragOption('helper', function(event)
	{
        var pos = ADockingFrame.getFramePosition(cntrId);
        
        //최초, 도킹 되어져 있는 경우, 의미 없는 값이 들어 있음. -> {x:0, y:0, width:2, height: 26}
        if(pos.width<10)
        {
            pos.width = 300;    //초기값 셋팅
            pos.height = 400;
        }

        var rt = event.currentTarget.getBoundingClientRect();

        //마우스가 undock 되려는 프레임의 타이틀 영역을 벗어나면 
        if(event.pageX>rt.left+pos.width)
        {
            frame.setDragOption('cursorAt', { left: pos.width/2});
        }

		var $temp = frame.$ele.clone();
		$temp.css({width: pos.width+'px', height: pos.height+'px'});
		//theApp.rootContainer.$ele.append($temp);
		thisObj.undockParent.$ele.append($temp);
		
		return $temp;
    });
	
	if(this.delegator) this.delegator.onDockFrame(this, frame, tabPanel);
};

ADockablePanel.prototype._saveUndockParent = function(frame)
{
	this.undockParent = frame.getParent();
	
	if(!this.undockParent) this.undockParent = theApp.rootContainer;
};

ADockablePanel.prototype.undockFrame = function(frame, x, y, w, h)
{
	//undock 되기 이전 정보를 저장해 둔다.		
	ADockingFrame.setFramePosition(frame.getContainerId(), frame.getPositionInfo());
	//----------------------------------------------------------------------------------


	//자신이 도킹되어져 있던 패널을 얻어온다. 탭바가 포함되어져 있는 tappable 패널
	var tabPanel = frame.getParent().getParent(),
		inx = this.indexOfPanel(tabPanel);

	if(h==undefined) 
	{
		w = frame.getWidth();
		h = frame.getHeight();
	}
	
	//frame.setParent(theApp.rootContainer, { left: x+'px', top: y+'px', width: w+'px', height: h+'px' });
	frame.setParent(this.undockParent, { left: x+'px', top: y+'px', width: w+'px', height: h+'px' });
	//frame.onResize(); --> setParent 내부에서 호출됨

	frame.setResizeOption('disabled', false);
	frame.lastDockedCntr = frame.dockedCntr;
	frame.dockedCntr = null;
	
	//undock 된 frameWnd 가 닫히지 않도록 탭과 연결된 컨테이너값을 null 로 셋팅한다.
	frame.tab.cntr = null;
	
	var tabCnt = tabPanel.tabBar.removeTab(frame.tab);
	
	//tabPanel 에서 모든 윈도우가 undock 된 경우
	if(tabCnt==0) 
	{
		//tabPanel 제거, 변수 초기화
		this.removeSplit(inx);
		tabPanel = null;
		
		var cnt = this.getSplitCount();
		//tabPanel 이 모두 제거된 경우
		if(cnt==0) 
		{
			//스플릿터를 제거해 준다. 차후 윈도우가 다시 추가될 때 동적으로 생성된다. 
			this.destroySplit();
		
			//사이즈를 0으로 하여 숨겨둔다.
			var tmpc = this.getParent(),
				tinx = tmpc.indexOfPanel(this);
				
			tmpc.splitter.setSplitSize(tinx, 0);
		}
		
        //하나만 남은 경우
        else if(cnt==1)
        {
            //auto 로 지정해 준다.    
            this.splitter.setSplitSize(0, -1);
        }
	}
	
	//tab count 가 1개이면 tabbar 를 숨긴다.
	else if(tabCnt==1)
	{
		tabPanel.splitter.setSplitSize(1, 0);
	}
	
	//---------------------------------------------------------------------
	//	undock 을 위한 draggable 셋팅 초기화
	frame.setDragOption('distance', 1);
	frame.setDragOption('helper', 'original');
	frame.setDragOption('cursorAt', false);
	
	if(this.delegator) this.delegator.onUndockFrame(this, frame, tabPanel);
};


ADockablePanel.prototype.activeFrame = function(frame)
{
	var panel = frame.getParent().getParent();
	panel.tabBar.selectTabById(frame.getContainerId());
};

ADockablePanel.prototype.activeFrameByIndex = function(inx)
{
	if(this.splitter)
	{
		var cnt = this.getSplitCount(), tabPanel;
		
		for(var i=0; i<cnt; i++)
		{
			tabPanel = this.getSplitPanel(i);
			tabPanel.tabBar.selectTabByIndex(inx);
		}
	}
};

})();
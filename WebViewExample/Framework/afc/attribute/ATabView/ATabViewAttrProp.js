
/**
Constructor
Do not call Function in Constructor.
*/
ATabViewAttrProp = class ATabViewAttrProp extends BaseProp
{
    constructor()
    {
        super()
		
	
		this.attrPath = BaseProp.ATTR_PATH + 'ATabView/';
	
	

    }
}



ATabViewAttrProp.prototype.init = function(context, evtListener)
{
	BaseProp.prototype.init.call(this, context, evtListener);
	
	this.acc.insertItem('Tab', this.attrPath+'Tab.lay');
	this.acc.insertItem('Items', this.attrPath+'Items.lay');
	
	this.tabInfoGrid = this.findCompByClass('AGrid_')[0];

	//common
	this.insertCommonAttr();
};

ATabViewAttrProp.prototype.applyValueToSelComp = function(selComp, dataKey, valGroup, value)
{
	var preVal = '';
	
	if(valGroup=='ATTR_VALUE')
	{
		/*
		var preVal;
		
		if(dataKey=='data-style-tabnormal')
		{
			preVal = selComp.$ele.attr(dataKey);
			this.applyStyleValue(dataKey, value, selComp.$ele, selComp.$ele.find('.ATabView_deselect'));
			return preVal;
		}
		else if(dataKey=='data-style-tabselect')
		{
			preVal = selComp.$ele.attr(dataKey);
			this.applyStyleValue(dataKey, value, selComp.$ele, selComp.$ele.find('.ATabView_select'));
			return preVal;
		}
		*/
	}
	else if(valGroup=='CSS_VALUE')
	{
		if(dataKey=='tab-width')
		{
			preVal = selComp.$ele.find('.ATabView_select').css('width');
			
			selComp.$ele.find('span').css('width', value);
			
			return preVal;
		}
		else if(dataKey=='tab-height')
		{
			//asoocool_20180426
			preVal = selComp.tabArea.height();

			//값을 지운경우
			if(!value)
			{
				selComp.tabContents.css('height', '');
				selComp.tabArea.css('height', '');
				//selComp.tabHeight = value;
				selComp.tabArea.find('span').css('line-height', '');
			}
			else
			{
				if(!isNaN(value)) value += 'px';

				selComp.tabContents.css('height', 'calc(100% - ' + value + ')');
				selComp.tabArea.css('height', value);
				//selComp.tabHeight = value;
				selComp.tabArea.find('span').css('line-height', value);
			}
			//----
			
			
			return preVal;
		}
		else if(dataKey == 'tab-display')
		{
			//preVal = selComp.$ele.find('.tab_area').css('display');
			preVal = selComp.tabArea.css('display');
			
			if(value) selComp.hideTabArea();	//selComp.$ele.find('.tab_area').hide();
			else selComp.showTabArea();	//selComp.$ele.find('.tab_area').show();
		}
	}
	
	return BaseProp.prototype.applyValueToSelComp.call(this, selComp, dataKey, valGroup, value);
};

ATabViewAttrProp.prototype.getUpdateValue = function(selComp, dataKey, groupName)
{

	//단일 선택인 경우만 값을 읽어와 셋팅한다. 다중 선택인 경우는 값을 클리어 해준다.
	if(this.selCompArr.length==1)
	{
		if(groupName=='CSS_VALUE')
		{
			if(dataKey=='tab-width'){
			
				return selComp.$ele.find('.ATabView_select')[0].style.width;
				
			}
			else if(dataKey == 'tab-height'){
				
				return selComp.tabArea[0].style.height;
				
			}
			else if(dataKey == 'tab-display'){
				
				return selComp.tabArea.css('display') == 'none' ? true : false;
			}
			
		}
	}

	return BaseProp.prototype.getUpdateValue.call(this, selComp, dataKey, groupName);	
};

ATabViewAttrProp.prototype.updateAGrid_ = function(dataKey, valueComp, value)
{
	var p, row, tmp, index=0, arr = {}, splitStr;
	
	valueComp.removeAll();
	
	for(var key in value)
	{
		tmp = value[key].split(',')[3];
		if(tmp) arr[tmp] = value[key];
		else arr[index++] = value[key];
	}

	for(var i in arr)
	{
		splitStr = arr[i].split(',');
		row = valueComp.addRow(splitStr);
		valueComp.setCellData(row, 0, splitStr[0]);
		valueComp.setCellData(row, 1, [splitStr[0], splitStr[1], splitStr[2]]);
	}
	
	var ctrlView = this.findCompByGroup('CTRL_VIEW')[0];
	
	var selEdit = ctrlView.getChild(0).getChild(1),
		selTabId = selEdit.getText();
	
	if(selTabId)
	{
		var selRow = valueComp.findRowByCellData(0, selTabId);
		if(selRow)
		{
			valueComp.selectCell(selRow);
			this.onDataTabinfoSelect(valueComp);
		}
	}

	//각 셀에 풍선말을 단다.
	var rows = valueComp.getRows();
	rows.each(function()
	{
		$(this).children().each(function()
		{
			$(this).attr('title', this.textContent);
		});
	});
	
};


ATabViewAttrProp.prototype.onAddTabBtnClick = function(comp, info, e)
{
	var wnd = new AFrameWnd_('AddItemDlg'),
		ofs = comp.get$ele().offset(),
		w = 240, compH = comp.getHeight();
		
	
	wnd.setWindowOption(
	{
		isModal: true,
		isFocusLostClose: true,
		modalBgOption: 'none',
	});
	
	if(ofs.left+190 > $(window).width()) ofs.left = $(window).width() - w - 5;
	wnd.open('Source/popup/TabViewItemDlg.lay', null, ofs.left, ofs.top+compH, w, '174px');
	
	wnd.setTitleText('Add Item');
	var thisObj = this;
	wnd.setResultCallback(function(result, data)
  	{
		if(result == 0)
		{
			var tabId = data.id,
				tabName = data.name,
				tabUrl = data.url;

			if(!tabId || !tabName || !tabUrl) return;

			var row = thisObj.tabInfoGrid.addRow([ tabId, tabName, tabUrl ]);
			thisObj.tabInfoGrid.setCellData(row, 0, tabId);
			thisObj.tabInfoGrid.setCellData(row, 1, [ tabId, tabName, tabUrl ]);
			thisObj.applyGridChange();
		}
	});
	
};

ATabViewAttrProp.prototype.onEditTabBtnClick = function(comp, info, e)
{
	if(this.tabInfoGrid.getSelectedCells().length == 0) return;
	
	var wnd = new AFrameWnd_(),
		ofs = comp.get$ele().offset(),
		w = 240, compH = comp.getHeight();
		
	wnd.setWindowOption(
	{
		isModal: true,
		isFocusLostClose: true,
		modalBgOption: 'none',
	});
	
	if(ofs.left+190 > $(window).width()) ofs.left = $(window).width() - w - 5;
	wnd.open('Source/popup/TabViewItemDlg.lay', null, ofs.left, ofs.top+compH, w, '174px');
	
	var row = this.tabInfoGrid.getSelectedCells()[0];
	var index = this.tabInfoGrid.indexOfRow(row);
	var dataArr = this.tabInfoGrid.getCellData(index, 1);
	wnd.view.settingTextByData(dataArr[0], dataArr[1], dataArr[2]);
	wnd.setTitleText('Edit Item');
	var thisObj = this;
	wnd.setResultCallback(function(result, data)
	{
		if(result == 0)
		{
			var tabId = data.id,
				tabName = data.name,
				tabUrl = data.url;
				
			if(!tabId || !tabName || !tabUrl) return;
			
			thisObj.tabInfoGrid.setCellText(index, 0, tabId);
			thisObj.tabInfoGrid.setCellText(index, 1, tabName);
			thisObj.tabInfoGrid.setCellText(index, 2, tabUrl);
			
			thisObj.tabInfoGrid.setCellData(index, 0, tabId);
			thisObj.tabInfoGrid.setCellData(index, 1, [ tabId, tabName, tabUrl ]);
			thisObj.applyGridChange();
			
		}
	});
};

ATabViewAttrProp.prototype.onRemoveTabBtnClick = function(comp, info, e)
{
	var selRows = this.tabInfoGrid.getSelectedCells(),
		row = selRows[0];
		
	if(selRows.length>0) 
	{
		this.tabInfoGrid.clearSelected();
		this.tabInfoGrid.removeRow(row);
		this.applyGridChange();
	}
};

ATabViewAttrProp.prototype.onMoveBtnClick = function(comp, info, e)
{
	if(this.tabInfoGrid.getSelectedCells().length == 0) return;
	var move;
	if(comp.compId =="UP") move = -1;
	else if(comp.compId =="DOWN") move = 1;
	
	var savedRow = this.tabInfoGrid.getSelectedCells()[0];
	var savedIndex = this.tabInfoGrid.indexOfRow(savedRow);
	var savedDataArr = this.tabInfoGrid.getCellData(savedIndex, 1).slice();
	
	if(savedIndex+move == -1) return;
	
	var row = this.tabInfoGrid.getRow(savedIndex+move);
	if(!row) return;
	var index = savedIndex+move;
	var dataArr = this.tabInfoGrid.getCellData(index, 1).slice();
	
	this.tabInfoGrid.setCellText(savedIndex, 0, dataArr[0]);
	this.tabInfoGrid.setCellText(savedIndex, 1, dataArr[1]);
	this.tabInfoGrid.setCellText(savedIndex, 2, dataArr[2]);
	
	this.tabInfoGrid.setCellText(index, 0, savedDataArr[0]);
	this.tabInfoGrid.setCellText(index, 1, savedDataArr[1]);
	this.tabInfoGrid.setCellText(index, 2, savedDataArr[2]);
	
	this.tabInfoGrid.setCellData(savedIndex, 0, dataArr[0]);
	this.tabInfoGrid.setCellData(savedIndex, 1, dataArr);
	
	this.tabInfoGrid.setCellData(index, 0, savedDataArr[0]);
	this.tabInfoGrid.setCellData(index, 1, savedDataArr);
	
	this.tabInfoGrid.selectCell(row, false);
	
	this.applyGridChange();
};


ATabViewAttrProp.prototype.onDataTabinfoSelect = function(comp, info, e)
{
	var prjView = theApp.getProjectView(),
		selComp = this.selCompArr[0],
		selRow 	= comp.getSelectedCells()[0],
		url 	= comp.getCellText(selRow, 2);
		
	var item = prjView.findProjectItemByTreePath(url);
	
	if(item)
	{
		url = prjView.getFullPath(item);
		if(AUtil_.extractExtName(url) != 'lay')
		{
			selComp.tabContents.children().remove();
			return;
		}
		
		var html = afc_.getFileSrc(url);
		if(html)
		{
			selComp.tabContents.children().remove();
			
			// Button 에 Icon을 등록한 경우
			// <img src="relUrl"> -> <img src="absUrl">
			// background-image: url("relUrl") -> background-image: url("absUrl")
			if(theApp.resMap && theApp.resMap.replaceRelToAbs)
			{
				html = theApp.resMap.replaceRelToAbs('src="', '"', html);
				html = theApp.resMap.replaceRelToAbs('url(', ')', html, 2);
			}
			
			selComp.tabContents.append(html);
			
			var child = selComp.tabContents.children();
			child.find('.RGrid-Style').removeAttr('id').css('border', '1px solid blue').text('rMate Grid').css('text-align','center');
			child.find('.RChart-Style').removeAttr('id').css('border', '1px solid yellow').text('rMate Chart').css('text-align','center');
			child.css('position', 'relative');
		}
	}
};

ATabViewAttrProp.prototype.onDataTabinfoDblClick = function(comp, info, e)
{
	var prjView = theApp.getProjectView(),
		selRow 	= comp.getSelectedCells()[0],
		url 	= comp.getCellText(selRow, 2);
		
	var item = prjView.findProjectItemByTreePath(url);
	
	if(item)
	{
		theApp.openDocTmplFile(prjView.getFullPath(item));
	}
};

ATabViewAttrProp.prototype.applyGridChange = function()
{
	var value = {}, infoGrid = this.tabInfoGrid,
		$rows = infoGrid.getRows(), key;

	$rows.each(function(rowIndex)
	{
		key = infoGrid.getCellData(this, 0);
		
		value[key] = [
			infoGrid.getCellText(this, 0),
			infoGrid.getCellText(this, 1),
			infoGrid.getCellText(this, 2),
			rowIndex
		];
	});

	this.applyValue(infoGrid, value);

};






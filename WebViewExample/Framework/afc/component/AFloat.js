
/**
 * @author asoocool
 */

class AFloat
{
	constructor()
	{
		this.$frame = null;
		this.$bg = null;

		this.isBgCheck = true;
		this.isFocusLostClose = true;

		this.zIndex = 9999;
		this.closeCallback = null;
	
	}

}

window.AFloat = AFloat

AFloat.prototype.init = function()
{
	this.$frame = $('<div></div>');
};


AFloat.prototype.append = function(ele)
{
	this.$frame.append(ele);
};


/*
AFloat.prototype.popup = function(left, top, width, height)
{
	//window position size
	if(!isNaN(left)) left += 'px';
	if(!isNaN(top)) top += 'px';
	if(!isNaN(width)) width += 'px';
	if(!isNaN(height)) height += 'px';
	
	this.$frame.css( { 'position':'fixed', 'left':left, 'top':top, 'z-index':this.zIndex });
	if(width) this.$frame.css('width', width);
	if(height) this.$frame.css('height', height);
	
	if(this.isBgCheck) this._checkBg();
	
	$('body').append(this.$frame);
};
*/

AFloat.prototype.popup = function(left, top, width, height, closeCallback, cntr)
{
	//window position size
	if(!isNaN(left)) left += 'px';
	if(!isNaN(top)) top += 'px';
	if(!isNaN(width)) width += 'px';
	if(!isNaN(height)) height += 'px';
	
	this.popupEx({ 'left': left, 'top': top, 'width': width, 'height': height }, closeCallback, cntr);
};

AFloat.prototype.popupEx = function(info, closeCallback, cntr)
{
	if(!cntr) 
	{
		//현재 활성화된 브라우저의 body 에 Element 를 추가하기 위해
		cntr = AApplication.getFocusedApp()?.getRootContainer();
		if(!cntr) return
	}
	
	info['position'] = 'fixed';
	info['z-index'] = this.zIndex;
	info['pointer-events'] = 'auto';
	//this.$frame.css( { 'position':'fixed', 'z-index':this.zIndex });
	this.$frame.css( info );
	
	this.closeCallback = closeCallback;
	
	if(this.isBgCheck) this._checkBg(cntr);
	
	//$('body').append(this.$frame);
	cntr.$ele.append(this.$frame);
};

/*
AFloat.prototype.moveToCenter = function()
{
    //var cenX = theApp.rootContainer.getWidth()/2 - this.getWidth()/2;
    //var cenY = theApp.rootContainer.getHeight()/2 - this.getHeight()/2;
	
	var cenX, cenY;
	
	if(this.option.inParent)
	{
    	cenX = this.parent.$ele.width()/2 - this.getWidth()/2;
    	cenY = this.parent.$ele.height()/2 - this.getHeight()/2;
	}
	else
	{
    	cenX = $(window).width()/2 - this.getWidth()/2;
    	cenY = $(window).height()/2 - this.getHeight()/2;
	}
    
    this.move(cenX, cenY);
};
*/


AFloat.prototype.close = function(result)
{
	if(this.$frame)
	{
    	this.$frame.remove();
    	this.$frame = null;
    }
    
    if(this.$bg)
    {
		this.$bg.remove();
		this.$bg = null;
	}
	
	if(this.closeCallback) this.closeCallback(result);
};


AFloat.prototype.enableBgCheck = function(enable)
{
	this.isBgCheck = enable;
};

AFloat.prototype._checkBg = function(cntr)
{
	if(this.$bg) return;
	
	this.$bg = $('<div></div>');
	this.$bg.css(
	{
		'width':'100%', 'height':'100%',
		'position':'fixed',
		'top':'0px', 'left':'0px',
		'z-index': (this.zIndex-1),
		'pointer-events': 'auto'
	});
	
	//$('body').append(this.$bg);
	cntr.$ele.append(this.$bg);
	
	if(this.isFocusLostClose)
	{
		var thisObj = this;
		AEvent.bindEvent(this.$bg[0], AEvent.ACTION_DOWN, function(e)
		{
			e.preventDefault();
			e.stopPropagation();

			thisObj.close();
		});
	}
	
	/*
	this.$bg.mousemove(function(e)
	{
		e.preventDefault();
		e.stopPropagation();
		
		return false;
	});
	*/
	
};

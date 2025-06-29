
/**
 * @author bks
 * @working date 2017-08-18
 */
 
class AIndicator extends AFloat
{
	constructor()
	{
		super()
	
		this.isFocusLostClose = false;
		this.indiSpan = null;
		this.spinClassName = 'loader_type2';

		this.divCss = {
			'position': 'absolute',
			'width': '100%',
			'height': '100%',
			//'z-index': '2147483647',
			'background': 'rgba(0,0,0,0)'
		};

		this.spanCss = [
			'box-shadow:2px 2px 5px rgba(34, 34, 34, 0.5)',
			'-webkit-filter: drop-shadow(2px 2px 5px rgba(34, 34, 34, 0.5))',
			'-moz-filter: drop-shadow(2px 2px 5px rgba(34, 34, 34, 0.5))',
			'-ms-filter: drop-shadow(2px 2px 5px rgba(34, 34, 34, 0.5))',
			'-o-filter: drop-shadow(2px 2px 5px rgba(34, 34, 34, 0.5))',
			'filter: drop-shadow(2px 2px 5px rgba(34, 34, 34, 0.5))'
		];
	}
	
}

window.AIndicator = AIndicator

AIndicator.indicator = null;
AIndicator.prgRefCount = 0;
AIndicator.isOltp = false;

AIndicator.setBackground = function(background)
{
	if(!AIndicator.indicator) AIndicator.indicator = new AIndicator();
	AIndicator.indicator.divCss.background = background || 'rgba(0,0,0,0)';
};

AIndicator.setClass = function(cssName)
{
	if(!AIndicator.indicator) AIndicator.indicator = new AIndicator();
	AIndicator.indicator.setClassName(cssName);
};

AIndicator.show = function()
{
	if(AIndicator.isOltp) return;
	if(++AIndicator.prgRefCount>1) return;

	if(AIndicator.timeout)
	{
		clearTimeout(AIndicator.timeout);
		AIndicator.timeout = null;
		return;
	}
	
	if(!AIndicator.indicator) AIndicator.indicator = new AIndicator();
	AIndicator.indicator.show();
};

AIndicator.hide = function()
{
	if(AIndicator.isOltp || AIndicator.prgRefCount==0) return;
	if(--AIndicator.prgRefCount>0) return;
	
	if(AIndicator.timeout)
	{
		clearTimeout(AIndicator.timeout);
		AIndicator.timeout = null;
	}

	//show 상태에서 hide, show 호출되면 인디케이터가 사라졌다 보임처리 되므로
	//연속성을 위해 setTimeout 으로 숨김처리한다.
	AIndicator.timeout = setTimeout(function()
	{
		AIndicator.timeout = null;
		if(AIndicator.indicator) AIndicator.indicator.hide();
	});
};

AIndicator.beginOltp = function()
{
	if(AIndicator.isOltp) return;
	//oltp가 아니고 프로그레스가 더 있으면 무조건 제거
	if(AIndicator.prgRefCount>0) AIndicator.endOltp();
	
	AIndicator.prgRefCount = 0;
	AIndicator.show();
	AIndicator.isOltp = true;
};

AIndicator.endOltp = function()
{
	AIndicator.isOltp = false;
	AIndicator.prgRefCount = 1;
	AIndicator.hide();
};

AIndicator.prototype.init = function()
{
	AFloat.prototype.init.call(this);
	
};

AIndicator.prototype.setClassName = function(cssName)
{
	this.spinClassName = cssName||'loader_type2';
	
	if(this.indiSpan) this.indiSpan.setAttribute('class', this.spinClassName);
};

AIndicator.prototype.createSpan = function()
{
	this.indiSpan = document.createElement('div');
	//this.indiSpan.style.cssText = this.spanCss.join(";");
	//this.indiSpan.setAttribute('class', 'loadspin-box');
	
	this.indiSpan.setAttribute('class', this.spinClassName);
};

AIndicator.prototype.show = function()
{
	AIndicator.isShow = true;

	if(!afc.isSimulator && window.cordova) window.cordova.exec( null , null, "AppPlugin" , "progress", [AppManager.PROGRESS_SHOW]);
	else 
	{
		this.init();	//Indicator div 생성		
		
		this.createSpan();	//Indicator Span 생성
		
		this.append(this.indiSpan);	//Indicator 객체 삽입

		//Toast DIV css 정보 추가
		this.popupEx(this.divCss, null);

	}

};


AIndicator.prototype.hide = function()
{
	AIndicator.isShow = false;
	
	if(!afc.isSimulator && window.cordova) window.cordova.exec( null , null, "AppPlugin" , "progress", [AppManager.PROGRESS_HIDE]);
	else
	{
		if(this.$frame) 
		{
			this.indiSpan = null;		
			this.close();
		}
	}
};


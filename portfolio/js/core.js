var EM = {
	Config : {
		sHTMLtag : "can-has-js"
		,sSelPNG : "#about, p.pic, fieldset"
	}

	/*
		STOP EDITING HERE
	*/
	,init : function() {
		var c = EM;
		var p = c.Project;
		var u = c.Utility;

		u.addDOMLoadEvent(function() {
			p.tagIt();
			p.scroll();
		});
		if (typeof DD_belatedPNG != "undefined") {
			DD_belatedPNG.fix(c.Config.sSelPNG);
		}
	}
	,Project : {
		scroll : function() {
			var c = EM;
			var u = c.Utility;

			var elPos = function(sId) {
				var oEl = document.getElementById(sId),
					iY = oEl.offsetTop,
					oNode = oEl;
				while (oNode.offsetParent && oNode.offsetParent != document.body) {
					oNode = oNode.offsetParent;
					iY += oNode.offsetTop;
				}
				return iY;
			}
			var currentY = function() {
				if (self.pageYOffset) {
					return self.pageYOffset;
				}
				if (document.documentElement && document.documentElement.scrollTop) {
					return document.documentElement.scrollTop;
				}
				if (document.body.scrollTop) {
					return document.body.scrollTop;
				}
				return 0;
			}
			var smoothScroll = function(sId) {
				var startY = currentY(),
					stopY = elPos(sId),
					iDist = stopY > startY ? stopY - startY : startY - stopY;

				if (iDist < 100) {
					scrollTo(0, stopY);
					return;
				}

				var speed = Math.round(iDist / 100);
				if (speed >= 20) speed = 20;
				var step = Math.round(iDist / 25),
					leapY = (stopY > startY) ? startY + step : startY - step,
					timer = 0;
				if (stopY > startY) {
					for (var i = startY; i < stopY; i+=step) {
						setTimeout("window.scrollTo(0, "+leapY+")", timer * speed);
						leapY += step;
						if (leapY > stopY) leapY = stopY;
						timer++;
					} return;
				}
				for (var i=startY; i>stopY; i-=step) {
					setTimeout("window.scrollTo(0, "+leapY+")", timer * speed);
					leapY -= step; if (leapY < stopY) leapY = stopY; timer++;
				}
			}

			var aDivs = document.getElementsByTagName("div"),
				iMax = aDivs.length;

			for (var i = 0; i < iMax; i++) {
				var oThis = aDivs[i];
				if (u.wordFind("nav", oThis.className)) {
					var aLinks = oThis.getElementsByTagName("a"),
						jMax = aLinks.length;

					for (var j = 0; j < jMax; j++) {
						aLinks[j].onclick = function() {
							var sId = this.getAttribute("href").split("#")[1];
							smoothScroll(sId);
						};
					}
				}
			}
		}
		,tagIt : function() {
			var c = EM;
			var u = c.Utility;

			var oHtml = document.getElementsByTagName("html")[0];

			if (oHtml) {
				oHtml.className = u.safeAppend(oHtml.className, c.Config.sHTMLtag);
			}
		}
	}
	,Utility : {
		// From http://www.thefutureoftheweb.com/blog/adddomloadevent
		addDOMLoadEvent : (function(){
			// create event function stack
			var load_events = [],
				load_timer,
				script,
				done,
				exec,
				old_onload,
				init = function () {
					done = true;

					// kill the timer
					clearInterval(load_timer);

					// execute each function in the stack in the order they were added
					while (exec = load_events.shift())
						exec();

					if (script) script.onreadystatechange = '';
				};

			return function (func) {
				// if the init function was already ran, just run this function now and stop
				if (done) return func();

				if (!load_events[0]) {
					// for Mozilla/Opera9
					if (document.addEventListener)
						document.addEventListener("DOMContentLoaded", init, false);

					// for Internet Explorer
					/*@cc_on @*/
					/*@if (@_win32)
						document.write("<script id=__ie_onload defer src=//0><\/scr"+"ipt>");
						script = document.getElementById("__ie_onload");
						script.onreadystatechange = function() {
							if (this.readyState == "complete")
								init(); // call the onload handler
						};
					/*@end @*/

					// for Safari
					if (/WebKit/i.test(navigator.userAgent)) { // sniff
						load_timer = setInterval(function() {
							if (/loaded|complete/.test(document.readyState))
								init(); // call the onload handler
						}, 10);
					}

					// for other browsers set the window.onload, but also execute the old window.onload
					old_onload = window.onload;
					window.onload = function() {
						init();
						if (old_onload) old_onload();
					};
				}

				load_events.push(func);
			}
		})()
		,addLoadEvent : function(func) {
			var oldonload = window.onload;
			if (typeof window.onload != 'function') {
				window.onload = func;
			} else {
				window.onload = function() {
					oldonload();
					func();
				}
			}
		}
		,safeAppend : function(target, str) {
			target += (target.length > 0 ? " ": "") + str;
			return target;
		}
		,wordFind : function(needle, haystack) {
			return haystack.match(needle + "\\b");
		}
	}
};

EM.init();
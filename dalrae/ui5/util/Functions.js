jQuery.sap.declare("dalrae.ui5.util.Functions");


dalrae.ui5.util.Functions = {
    
    //legacy cross app navigate, eventually will be implemented into Interop as a legacy means of navigation when no containers exist -PhillS
	interAppNavigation: function(action, sObject, deepLinkURI, params) {
		if (sap.ushell && sap.ushell.Container) {
			var fgetService = sap.ushell.Container.getService;
			if (fgetService) {
				var oCrossAppNavigator = fgetService("CrossApplicationNavigation");
				if (oCrossAppNavigator) {
					oCrossAppNavigator.toExternal({
						target: {
							semanticObject: sObject,
							action: action
						},
						params: (params ? params : { }),
						appSpecificRoute: deepLinkURI
					});
				}
			}
		}
	},
	
	isInternetExplorer: function() {
		if(navigator.appName == 'Microsoft Internet Explorer' 
		||  !!(navigator.userAgent.match(/Trident/) 
		|| navigator.userAgent.match(/rv:11/)) 
		|| (typeof $.browser !== "undefined" && $.browser.msie == 1)) {
			return true;
		} else {
			return false;
		}
	},
	
	isMicrosoftBrowser: function() {
		if(dalrae.ui5.util.Functions.isInternetExplorer()) {
			return true; //ie
		} else {
			if(document.documentMode || /Edge/.test(navigator.userAgent)) {
				return true; //edge
			} else {
				return false;
			}
		}
	},
	
	stringToFunction: function(str) {
		var path = str.split(".");
		var fn = window;
		for(var i = 0; i < path.length; i++) {
			fn = fn[path[i]];
		}
		if(typeof fn !== "function") {
			throw new Error("function not found: " + str);
		}
		return fn;
	},
	
	findParentOfType: function(oControl,sType) {
		var prnt = oControl.getParent();
		if(prnt) {
			if(prnt.getMetadata) {
				var t = prnt.getMetadata()._sClassName;
				if(t === sType) {
					return prnt;
				} else {
					return dalrae.ui5.util.Functions.findParentOfType(prnt,sType);
				}
			} else {
				return null;
			}
		} else {
			return null;
		}
	}
	
	
	
};
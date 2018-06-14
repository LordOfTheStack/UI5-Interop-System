//this is to be inherited by generic controller at the suite or app level -PhillS
jQuery.sap.require("dalrae.ui5.routing.Interop");
sap.ui.core.mvc.Controller.extend("dalrae.ui5.BaseController", {
   
	onBeforeRendering: function() {
		//fallback routing support (allows apps to run standalone and still call .navigateContainer) -PhillS
		if(dalrae.ui5.routing.Interop.UseFallbackRouting) {
			dalrae.ui5.routing.Interop.mFallbackRouter = this.getRouter();
		}
	},
		
	// supports our Interop component containers method of routing -PhillS
    getRouter: function() {
    	//UPDATED to work with manifest style apps -PhillS
	    var router = sap.ui.core.UIComponent.getRouterFor(this);
	    if(!router || dalrae.ui5.routing.Interop._cc ) {
	    	if(dalrae.ui5.routing.Interop._cc[dalrae.ui5.routing.Interop.StandardContainer.Main] || !router) {
		    	var router2 = dalrae.ui5.routing.Interop.getRouterFor(this);
		    	if(router2) {
		    		return router2;
		    	}	
	    	}
	    }
		if(dalrae.ui5.routing.Interop.UseFallbackRouting) {
			//fallback routing support (allows apps to run standalone and still call .navigateContainer) -PhillS
			dalrae.ui5.routing.Interop.mFallbackRouter = router;
		}
	    return router;
    },
   
    getComponent: function() {
        if(this.getRouter().getComponent) {
            return this.getRouter().getComponent();
        } else {
            return this.getOwnerComponent();
        }
    },
	
    /**
     * Retrieve ODataService with the given name
     * shorthand for this.getComponent().getModel(name)
     **/
    getService : function(name) {
    	if(name) {
    		return this.getComponent().getService(name);
    	} else {
    		return this.getComponent().getService();
    	}
    },
	
	getAppName: function() {
		var cn = this.getMetadata()._sClassName;
		var cnp = cn.split('.');
		return cnp[0] + "." + cnp[1];
	},

	getAppPath: function() {
		return jQuery.sap.getModulePath(this.getAppName());
	},
 
    /**
     * find control on this view
     * and if not found, look for it globally
     * shorthand for this.byId(id) and sap.ui.getCore().byId(id)
     * @param {string} id control id
     * @return {Object} the control instance, or undefined if not found
     **/
    byId: function(id) {
        var obj = null;
        if(this.getView && this.getView())
            obj = this.getView().byId(id);
        if(!obj)
            obj = sap.ui.getCore().byId(id);
        if(!obj && this.sId)
            obj = sap.ui.getCore().byId( sap.ui.core.Fragment.createId(this.sId,id) );
        return obj;
    }
    
    
});
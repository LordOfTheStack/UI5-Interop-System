sap.ui.define([
	"dalrae/ui5/BaseController",
	'sap/ui/model/Filter',
	'sap/ui/model/json/JSONModel',
	'dalrae/ui5/routing/Interop'

], function(GenericController, Filter, JSONModel, Interop) {

	"use strict";
	return GenericController.extend("sample.container.view.Master", {

	onInit : function() {
		
		//weird sap lifecycle bug, creating a duplicate of our master page. only keep the first one
		if(window.mSingleton) {
			this.IMPOSTER = true; //debuggig purposes, to make sure any events fired arent on the wrong controller
			this.destroy();
			return;
		} else {
			window.mSingleton = this;
		}
		
		Interop.attachEvent(Interop.StandardAction.OpenMaster,this.openMaster,this);    
		Interop.attachEvent(Interop.StandardAction.CloseMaster,this.closeMaster,this);  
	},

    onExit: function() {
		Interop.detachEvents(this);
		window.mSingleton = null;
	},
	
	onAfterRendering: function() {
		this.byId("pMaster").setHeaderExpanded(false);	
	},

	toggleMaster: function() {
		Interop.fireEvent(Interop.StandardAction.CloseMaster);
	},
	
	openMaster: function(oEvent) {
		var app = this.getView().getParent().getParent();
		app.setMode("ShowHideMode");
		window._masterOpen = true;
		Interop.raiseEvent(Interop.StandardEvent.OnMasterOpen);
		
	},
	
	closeMaster: function(oEvent) {
		var app = this.getView().getParent().getParent();
		app.setMode("HideMode");
		window._masterOpen = false;
		Interop.raiseEvent(Interop.StandardEvent.OnMasterClose);
	}

});
});
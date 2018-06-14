/**
	Sample Interop Compatible App
	By Phillip Smith (Lord of the Stack)
	June 2018
**/
sap.ui.define([
	"dalrae/ui5/BaseController",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'sap/ui/model/json/JSONModel',
	'dalrae/ui5/routing/Interop'

], function(GenericController, Filter, FilterOperator, JSONModel, Interop) {

	"use strict";
	return GenericController.extend("sample.demoapp1.controller.Detail", {

    
	onInit: function() {
	    this.getRouter().attachRouteMatched(this._onRouteMatched, this);
	    
	},
	
	
	
	_onRouteMatched: function(oEvent) {
		
		this.Container = oEvent.getParameters().container;
		this.BP = oEvent.getParameters().arguments.partner;
		this.bindView();
		
	},
	
	bindView: function() {
	    
	    this.getView().bindElement( "/Clients/" + this.BP + "" );
	    this.getView().getModel().refresh(true);
	    
	},
	
	onDemonstrateNavTo1: function() {
		
		//demonstrating a standard navigation within the same BSP (Interop will automatically intercept this and route within the same container) -PhillS (LOTS)
		this.getRouter().navTo(
			"more",{
				partner: this.BP
			}
		)
		
	},
	
	onDemonstrateNavTo2: function() {
		
		//demonstrating an Interop cross app navigation.
		Interop.navigateContainer( Interop.StandardContainer.Main , {
			app: "sample.demoapp2",
			nav: [
				"main",
				{}
			]
		});
		
	}
    
});
});
sap.ui.define([
	"dalrae/ui5/BaseController",
	'sap/ui/model/Filter',
	'sap/ui/model/json/JSONModel',
	'dalrae/ui5/routing/Interop',
	'sap/m/MessageToast'

], function(GenericController, Filter, JSONModel, Interop, MessageToast) {

	"use strict";
	return GenericController.extend("sample.container.view.panels.BusinessPartner", {

		onInit: function() {
		
			this.getView().addStyleClass("sapUiSizeCompact");
			this.getRouter().attachRouteMatched(this._onRouteMatched, this);
			Interop.attachEvent(Interop.StandardEvent.OnNavigate, this.onNavigate, this);
			
		},
		onNavigate: function(oEvent) {
			var name = oEvent.getParameter("name");
			var app = oEvent.getParameter("app");

		},
		_onRouteMatched: function(oEvent) {
			if (oEvent.getParameter("container") === "header") {
				Interop.fireEvent("setHeaderHeight", {
					height: "150px"
				});
			}
		}
		

	});
});
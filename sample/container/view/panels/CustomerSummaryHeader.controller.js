sap.ui.define([
	"dalrae/ui5/BaseController",
	'sap/ui/model/Filter',
	'sap/ui/model/json/JSONModel',
	'dalrae/ui5/routing/Interop',
	'sap/m/MessageToast'

], function(GenericController, Filter, JSONModel, Interop, MessageToast) {

	"use strict";
	return GenericController.extend("sample.container.view.panels.CustomerSummaryHeader", {

		onInit: function() {
			this.getView().setModel(new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZCRM_PERSON_DETAILS_SRV"), "CustomerDetails");
			this.getView().addStyleClass("sapUiSizeCompact");
			this.getRouter().attachRouteMatched(this._onRouteMatched, this);
		},
		
		_onRouteMatched: function(oEvent) {
			var oController = this;
			var BPGuid = oEvent.getParameter('arguments').BPGuid//.replace(/(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/, '$1-$2-$3-$4-$5');
			var sContextPath = "/PersonalDetailsSet(guid'" + BPGuid + "')"
			this.getView().getModel("CustomerDetails").read(sContextPath, {
				success : function (oSuccess, response) {
					oController.getView().setBindingContext(new sap.ui.model.Context(oController.getView().getModel("CustomerDetails"), sContextPath), "CustomerDetails");
				},
				error : function (e) {
					//TODO: handle exception
				}
			});
		}

	});
});
sap.ui.define([
	"dalrae/ui5/BaseController",
	'sap/ui/model/Filter',
	'sap/ui/model/json/JSONModel',
	'dalrae/ui5/routing/Interop',
	'sap/m/MessageToast'
], function(GenericController, Filter, JSONModel, Interop, MessageToast) {

	"use strict";
	return GenericController.extend("sample.container.view.panels.Superkeys", {

		onInit: function() {
			this.loadReferenceData();
			this.loadAppPaths();

			this.getView().addStyleClass("sapUiSizeCompact");
			this.getRouter().attachRouteMatched(this._onRouteMatched, this);

			Interop.raiseEvent("setHeaderHeight", {
				height: "40px"
			});
		},
		_onRouteMatched: function(oEvent) {
			this.ContainerName = oEvent.getParameter("container");
			var workflowName = oEvent.getParameter("workflow");
			var workflows = this.getWorkflows();
			if (workflows) {
				var wfs = $.grep(workflows, function(item) {
					return item.processCode === workflowName;
				});
				if (wfs && wfs.length > 0) {
					var workflow = wfs[0];
					this.WorkflowId = workflow.id;
				}
			}
			
			this.bindView();
		},
		bindView: function() {
			var oSuperKeyModel = new JSONModel({
				selectedSuperKey: ''
			});
			this.getView().setModel(oSuperKeyModel, "superKeyData");
		},
		setHeaderRecord: function(headerDetail) {
			var oHeaderModel = new JSONModel({
				name: headerDetail.name
			});
			this.getView().setModel(oHeaderModel, "headerData");
		},
		loadAppPaths: function() {},
		loadReferenceData: function() {

			var referenceData = {
				superKeys: []
			};

			var routes = this.getRoutes();
			if (routes && routes.routes && routes.routes.length > 0) {
				var superKeys = this.getSuperKeys();
				if (superKeys && superKeys.superKeys && superKeys.superKeys.length > 0) {
					$(superKeys.superKeys).each(function(index, superKey) {
						var matchingRoutes = $.grep(routes.routes, function(item) {
							return item.id === superKey.routeId;
						});
						if (matchingRoutes && matchingRoutes.length > 0) {
							var matchingRoute = matchingRoutes[0];
							var entry = {
								key: superKey.superKey,
								app: matchingRoute.app,
								nav: matchingRoute.nav
							};
							referenceData.superKeys.push(entry);
						}
					});
				}
			}
			var oReferenceModel = new JSONModel(referenceData);
			this.getView().setModel(oReferenceModel, "referenceData");
		},
		onSuperKeySelected: function(oEvent) {
			var superKey = {};
			var sKeyModel = this.getView().getModel("superKeyData");
			var sKey = sKeyModel.getData().selectedSuperKey.toUpperCase();

			var referenceData = this.getView().getModel("referenceData").getData();
			var selectedSuperKeys = jQuery.grep(referenceData.superKeys, function(sk) {
				return sk.key === sKey;
			});

			if (selectedSuperKeys && selectedSuperKeys.length > 0) {
				superKey = selectedSuperKeys[0];
				Interop.navigateContainer(Interop.StandardContainer.Main, {
					app: superKey.app,
					nav: [superKey.nav, Interop.getCurrentRoute(this.ContainerName).nav[1]]
				});
			} else {
				MessageToast.show("Super key " + sKey + " not found");
			}
		},
		onLiveSuperSuggest: function(data) {

		},
		onSuggestSuperKey: function(data) {

		}

	});
});
jQuery.sap.registerModulePath("dalrae.ui5", jQuery.sap.getModulePath("sample.container") + "/../../dalrae/ui5");
jQuery.sap.require("dalrae.ui5.BaseComponent");
jQuery.sap.require("sap.m.routing.Router");
jQuery.sap.declare("sample.container.Component");

dalrae.ui5.BaseComponent.extend("sample.container.Component", {
	metadata: {
		name: "SampleContainer",
		version: "1.0",
		includes: ["css/style.css"],
		dependencies: {
			libs: ["sap.m", "sap.ui.layout"],
			components: []
		},

		rootView: "sample.container.view.App",

		routing: {
			config: {
				routerClass: sap.m.routing.Router, //sap.ui.core.routing.Router, //sample.container.MyRouter,
				viewType: "XML",
				viewPath: "sample.container.view",
				targetAggregation: "detailPages",
				clearTarget: false
			},
			routes: [{
				pattern: "",
				name: "main",
				view: "Master",
				targetAggregation: "masterPages",
				targetControl: "idAppControl",
				subroutes: [{
					name: "detail",
					view: "Detail",
					pattern: ""
				}]
			}, 
			{
				pattern: "",
				name: "mainpopulated",
				view: "Master",
				targetAggregation: "masterPages",
				targetControl: "idAppControl",
				subroutes: [{
					name: "populated",
					view: "Detail",
					pattern: "m/{master}-{mroute}/{detail}-{droute}"
				}]
			}, {
				name: "catchallMaster",
				view: "Master",
				targetAggregation: "masterPages",
				targetControl: "idAppControl",
				subroutes: [{
					pattern: ":all*:",
					name: "catchallDetail",
					view: "NotFound",
					transition: "show"
				}]
			}, {
				name: "superKeys",
				view: "panels.SuperKeys",
				pattern: ""
			}, {
				name: "processFlow",
				view: "panels.ProcessFlow",
				pattern: ""
			}, {
				name: "bpHeader",
				view: "panels.BusinessPartner",
				pattern: ""
			}, {
				name: "customerSummaryHeader",
				view: "panels.CustomerSummaryHeader",
				pattern: "{BPGuid}"
			}]
		}
	},

	init: function() {
		sap.ui.core.UIComponent.prototype.init.apply(this, arguments);

		// Set device model
		this.initDeviceModel();

		this.getRouter().initialize();
	}

});
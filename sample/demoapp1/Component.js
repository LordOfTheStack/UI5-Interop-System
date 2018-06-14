jQuery.sap.registerModulePath("dalrae.ui5", jQuery.sap.getModulePath("sample.demoapp1") + "/../../dalrae/ui5");

sap.ui.define([
		"dalrae/ui5/BaseComponent"
	], function (GenericComponent) {
		"use strict";

		return GenericComponent.extend("sample.demoapp1.Component", {

			metadata : {
				manifest : "json"
			},

			/**
			 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
			 * In this method, the FLP and device models are set and the router is initialized.
			 * @public
			 * @override
			 */
			init : function () {
				
				// call the base component's init function and create the App view
				GenericComponent.prototype.init.apply(this, arguments);
				
				// Set device model
				this.initDeviceModel();
		
				// create the views based on the url/hash
				this.getRouter().initialize();
				
			}

			

			

		});

	}
);
sap.ui.define(
    ['sap/ui/core/UIComponent'],
    function(Component) {
        
        return Component.extend("dalrae.ui5.BaseComponent",{

        	//this assumes that all apps namespace level is a consistent "suite.app" no more no less
        	getAppName: function() {
				var cn = this.getMetadata().getName(); //_sClassName;
				var cnp = cn.split('.');
				return cnp[0] + "." + cnp[1];
			},

			getAppPath: function() {
				return jQuery.sap.getModulePath(this.getAppName());
			},


			initDeviceModel: function() {
		        // Set device model
				var oDeviceModel = new sap.ui.model.json.JSONModel({
					isTouch : sap.ui.Device.support.touch,
					isNoTouch : !sap.ui.Device.support.touch,
					isPhone : sap.ui.Device.system.phone,
					isNoPhone : !sap.ui.Device.system.phone,
					listMode : sap.ui.Device.system.phone ? "None" : "SingleSelectMaster",
					listItemType : sap.ui.Device.system.phone ? "Active" : "Inactive"
				});
				oDeviceModel.setDefaultBindingMode("OneWay");
				this.setModel(oDeviceModel, "device");    
		    }
	
	});
});
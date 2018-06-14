sap.ui.define([
	"dalrae/ui5/BaseController",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'sap/ui/model/json/JSONModel',
	'sap/m/MessageBox',
	'dalrae/ui5/routing/Interop'

], function(GenericController, Filter, FilterOperator, JSONModel, MessageBox, Interop) {

	"use strict";
	return GenericController.extend("sample.demoapp1.controller.Master", {

	onInit : function() {
		this.onSearch();
	},


	onSearch: function(oEvent) {
		if(!this.masterFragment) {
			this.masterFragment = sap.ui.xmlfragment("sample.demoapp1.fragments.MasterItem", this);
		}
		this.byId("lstResults").bindItems({
			path: "/Clients",
			template: this.masterFragment,
			filters: [
				new Filter({ filters: [
					new Filter("ID",FilterOperator.EQ,this.byId("searchField").getValue()), 		//ID exact match
					new Filter("Index",FilterOperator.EQ,this.byId("searchField").getValue()), 		//OR Index exact match
					new Filter("Name",FilterOperator.Contains,this.byId("searchField").getValue()) 	//OR Name match
				], and: false})
			]
		});
	},
	
	onSelect: function(oEvent) {
		var item = oEvent.getParameter("listItem");
		var obj = item.getBindingContext().getObject();
		var bp = obj.Index;
		
		//Interop navigation method. Navigate the main container based on our selection
		//This is an example of routing a master detail view, it can also be done the legacy way, see below
		Interop.navigateContainer( Interop.StandardContainer.Main , {
			app: this.getAppName(),
			nav: [
				"detail",
				{
					partner: bp
				}
			]
		});
		
		//this could also be done through a standard navTo, because Interop will detect that this is a master/detail app and act appropriately
		//feel free to trial it out if you're curious, comment out the above navigateContiner, and uncomment this navTo -PhillS
		/*this.getRouter().navTo(
			"detail",{
				partner: bp
			}
		)*/
		
		//don't keep the item highlighted in the master list
		oEvent.getSource().setSelectedItem( item , false ); 
	},
	
	onNew: function() {
		MessageBox.show("That's just for decoration");
	}

});
});
sap.ui.define([
	"dalrae/ui5/BaseController",
	'sap/ui/model/Filter',
	'sap/ui/model/json/JSONModel',
	'dalrae/ui5/routing/Interop',
	'dalrae/ui5/util/Functions'

], function(GenericController, Filter, JSONModel, Interop, Functions) {

	"use strict";
	return GenericController.extend("sample.container.view.Detail", {
    
    title: "Interop Framework",
    
	onInit: function() {
		this._loading = true;
		
		//weird lifecycle bug, creating a duplicate of our detail page. only keep the first one (might be an issue in my component, not sure yet)
		if(window.singleton) {
			this.IMPOSTER = true; //debuggig purposes, to make sure any events fired arent on the wrong controller
			this.destroy();
			return;
		} else {
			window.singleton = this;
		}
		
		//a local json model for controlling layout
		this.oLayoutData = {
			RightPanelOpen: false,
			RightPanelBig: false
		};
		this.oLayoutModel = new JSONModel(this.oLayoutData);
		this.getView().setModel(this.oLayoutModel,"Layout");
		
		//normal router in this case
	    this.getRouter().attachRouteMatched(this._onRouteMatched, this);
	    
	    //load the namespaces of all the apps we will use
	    this.registerNamespaces(); 
		
		//this allows the Interop system to manage browser history 
	    Interop.setRestoreOnBrowserBack(true);
	    
	    //register global events
	    Interop.attachEvent(Interop.StandardEvent.OnMasterOpen,this.openedMaster,this);    
		Interop.attachEvent(Interop.StandardEvent.OnMasterClose,this.closedMaster,this);  
	    Interop.attachEvent(Interop.StandardEvent.OnNavigate,this.onNavigate,this);  
	    Interop.attachEvent(Interop.StandardEvent.OnSessionRestored,this.onSessionRestored,this); 
	    Interop.attachEvent(Interop.StandardEvent.OnContainerCleared,this.onContainerCleared,this); 
	    Interop.attachEvent("setHeaderHeight",this.setHeaderHeight,this); 
		Interop.attachEvent("setInnerPanel",this.setInnerPanel,this); 
	},
	
	registerNamespaces: function() {
		//registering namespaces is important, any app you expect to navigate to, must be registered
		Interop.registerNamespace("sample.demoapp1");
		Interop.registerNamespace("sample.demoapp2");
	},

	onExit: function() {
		Interop.detachEvents(this); //get rid of all our event handlers
		window.singleton = null;
	},
	
	onAfterRendering: function() {
		if(!this._after) {
			this._after = true;
			
			//for some reason ,setting expanded=false in xml with these dynamicPages, doesn't work, you have to programmatically do it ater render.. lousy...
			this.byId("pRight").setHeaderExpanded(false);
			this.byId("pPage").setHeaderExpanded(false);
			
			$("body").addClass("ThemeDark"); //hardcode for now, will revisit theme detection later -PhillS
			//$("body").addClass("Theme" + (Functions.getSessionInfo().isDarkTheme ? "Dark" : "Light"));
				
			this._loading = false;
		}
	},
	
	
	onLoad: function() {
		if(Interop.getContainer(Interop.StandardContainer.Header) == null
		|| Interop.getContainer(Interop.StandardContainer.Main) == null
		|| Interop.getContainer(Interop.StandardContainer.Inner) == null
		|| Interop.getContainer(Interop.StandardContainer.Right) == null
		|| Interop.getContainer(Interop.StandardContainer.Master) == null
		|| this._loading) {
			//delay until all these containers are registered
			setTimeout(jQuery.proxy(this.onLoad,this),25);
			return;
		}
		
		
		var sessionResult = Interop.restoreSession();
		if(!sessionResult.restored) {
			//no existing route info, this is a blank run
			//example default route
			this._loaded = true;
			
			
			
			if(this.defaultDetailApp) {
				Interop.navigateContainer(Interop.StandardContainer.Main, {
					app: this.defaultDetailApp,
					nav: [this.defaultDetailRoute,{}]
				});
			} else {
				Interop.navigateContainer(Interop.StandardContainer.Main, {
					app: "sample.demoapp1",
					nav: ["main",{}] //this is a two target route but Interop will automatically select the second route for us
				});
			}
			
		
			if(this.defaultMasterApp) {
				Interop.navigateContainer(Interop.StandardContainer.Master, {
					app: this.defaultMasterApp,
					nav: [this.defaultMasterRoute,{}]
				});
				Interop.fireEvent( Interop.StandardAction.OpenMaster );
			} else {
				Interop.navigateContainer(Interop.StandardContainer.Master, {
					app: "sample.demoapp1",
					nav: ["main",{}] //this is a two target route but Interop will automatically select the first route for us because the container is named 'master'
				});
			}
			
			
		}
		
		this.updateButtons();
	},
	
	onSessionRestored: function(oEvent) {
		//called when a route is found in the url and executed, we capture it because this controller adds a few custom states (header & master expanded state)
		var sessionResult = oEvent.getParameters();
		var state = sessionResult.extraStateInfo;
		if(state) {
			if(state.me !== undefined) {
				state.me = (state.me === "true");
				if(state.me !== window._masterOpen) {
					if(state.me) {
						Interop.fireEvent(Interop.StandardAction.OpenMaster);
					} else {
						Interop.fireEvent(Interop.StandardAction.CloseMaster);
					}
				}
			}
			if(state.re !== undefined) {
				state.re = (state.re === "true");
				this.oLayoutData.RightPanelOpen = state.re;
			}
			if(state.rw !== undefined) {
				state.rw = (state.rw === "true");
				this.oLayoutData.RightPanelBig = state.rw;
			}
			this.oLayoutModel.refresh(true);
			var self = this;
			setTimeout(function(){
				self.oLayoutModel.refresh(true);
				self._loaded = true;
			},1000);
		}
	},
	
	onNavigate: function(oEvent) { //this event fires when ANY container is navigated
		
		if(oEvent.getParameter("container") === Interop.StandardContainer.Inner) {
			this.getView().byId("pSide").setShowSideContent(true);
		}
		if(oEvent.getParameter("container") === Interop.StandardContainer.Main) {
			var xmlview = Interop.getContainer(Interop.StandardContainer.Main).getContent()[0];
			var page = xmlview.getContent()[0];
			if(page.getTitle) {
				document.title = page.getTitle() || this.title;
				this.byId("txtTitle").setText(page.getTitle() || this.title);
			} else {
				document.title = this.title;
				this.byId("txtTitle").setText(this.title);
			}
			
		} else if(oEvent.getParameter("container") === Interop.StandardContainer.Right) {
			var xmlviewr = Interop.getContainer(Interop.StandardContainer.Right).getContent()[0];
			var pager = xmlviewr.getContent()[0];
			if(pager.getTitle) {
				this.byId("txtTitleRight").setText(pager.getTitle() || this.title);
			} else {
				this.byId("txtTitleRight").setText(this.title);
			}
		}
		if(!oEvent.getParameter("sessionRestore")
		&& (!oEvent.getParameter("tags") || !oEvent.getParameter("tags").NoHistory)
		) {
			this.updateUrl(); //update the session
		}
		this.updateButtons();
		
	},
	
	onContainerCleared: function(oEvent) {
		if(oEvent.getParameter("container") === Interop.StandardContainer.Right) {
			this.getView().byId("pSide").setShowSideContent(false);
		}
		if(oEvent.getParameter("container") === Interop.StandardContainer.Main) {
			document.title = this.title;
			this.byId("txtTitle").setText(this.title);
		}
		if(!oEvent.getParameter("sessionRestore")) {
			this.updateUrl();
		}
		this.updateButtons();
	},
	
	updateUrl: function() {
		if(this._loaded) {
			//save the session, and add additional session states (the state of expansion of the panels)
			//by doing this, we enable the page to be refreshed with f5 or the url to be copied & pasted into another browser, without losing track of what's in each panel
			Interop.saveSession({
				me: window._masterOpen || false,
				re: this.oLayoutData.RightPanelOpen,
				rw: this.oLayoutData.RightPanelBig
			});
		}
	},
	updateButtons: function() {
		this.byId("btnToggle").setIcon("sap-icon://" + (this.byId("pPage").getHeaderExpanded() ? "slim-arrow-up" : "slim-arrow-down"));
		//this.byId("btnToggleRight").setIcon("sap-icon://" + (this.byId("pPage").getHeaderExpanded() ? "slim-arrow-right" : "slim-arrow-left"));
		//this.byId("btnViewMode").setVisible(this.byId("pPage").getHeaderExpanded());
		//this.byId("btnViewModeRight").setVisible(this.byId("pSide").getShowSideContent());
		//this.byId("btnToggle").setEnabled( Interop.getContainer(Interop.StandardContainer.Header).getContent().length > 0 );
		//this.byId("btnMaster").setEnabled( Interop.getContainer(Interop.StandardContainer.Master).getContent().length > 0 );
	},
	
	setHeaderHeight: function(oEvent) {
		var cHeader = this.getView().byId("cHeader");
		var height = oEvent.getParameter("height");
		cHeader.setHeight(height);
	},
	
	setInnerPanel: function(oEvent) {
		var cSide = this.getView().byId("pSide");
		var visibility = oEvent.getParameter("visible");
		var equalsplit = oEvent.getParameter("equalSplit");
		if(visibility !== undefined) {
			cSide.setShowSideContent(visibility);
		}
		if(equalsplit !== undefined) {
			cSide.setEqualSplit(equalsplit);
		}
	},
	
	
	toggleHeader: function(oEvent) {
		this.byId("pPage").setHeaderExpanded(!this.byId("pPage").getHeaderExpanded());
		this.updateButtons();
		this.updateUrl();
	},
	
	toggleMaster: function(oEvent) {
		Interop.fireEvent(Interop.StandardAction.OpenMaster);
	},
	
	openedMaster: function() {
		this.byId("btnMaster").setVisible(false);
		this.updateUrl();
	},
	closedMaster: function() {
		this.byId("btnMaster").setVisible(true);
		this.updateUrl();
	},
	
	
	
	
	_onRouteMatched: function(oEvent) {
		
		var name = oEvent.getParameter("name");
		var arg = oEvent.getParameter("arguments");
		if(name === "populated") {
			this.defaultMasterApp = arg.master;
			this.defaultDetailApp = arg.detail;
			this.defaultMasterRoute = arg.mroute;
			this.defaultDetailRoute = arg.droute;
		}
		
	},
	
	bindView: function() {
	    
	},
	
	
	
	closeRight: function() {
		this.oLayoutData.RightPanelOpen = false;
		this.oLayoutModel.refresh(true);
		this.updateUrl();
	},
	openRight: function() {
		this.oLayoutData.RightPanelOpen = true;
		this.oLayoutModel.refresh(true);
		this.updateUrl();
	},
	
    
	
	showMoveDialog: function() {
		
		if(!this.copyDialog) {
			this.oLayoutData.BaseUrl = this.getAppPath();
			this.copyDialog = sap.ui.xmlfragment("sample.container.view.dialogs.MoveContentDialog",this);
			this.copyDialog.setModel(this.oLayoutModel,"Layout");
		}
		this.oLayoutData.MoveDirection = 0;
		this.oLayoutData.MoveDuplicate = false;
		this.oLayoutData.MoveDirection1 = (Interop.getCurrentRoute(Interop.StandardContainer.Right).app != null);
		this.oLayoutModel.refresh(true);
		
		this.copyDialog.open();
	},
	
	onMoveDialogCancel: function() {
		this.copyDialog.close();
	},
	
	onMoveDialogApply: function() {
		var panel = (this.oLayoutData.MoveDirection === 0 ? Interop.StandardContainer.Main : Interop.StandardContainer.Right);
		var target = (this.oLayoutData.MoveDirection === 1 ? Interop.StandardContainer.Main : Interop.StandardContainer.Right);
		var route = Interop.getCurrentRoute( panel );
		var app = route.app;
		var nav = route.nav;
		if(!this.oLayoutData.MoveDuplicate) {
			if(this.defaultDetailApp && panel === Interop.StandardContainer.Main) {
				Interop.navigateContainer(
					panel,
					{
						app: this.defaultDetailApp,
						nav: [
							this.defaultDetailRoute,
							{}
						]
					}
				);
			} else {
				Interop.clearContainer( panel );
			}
		}
		Interop.navigateContainer( target , { app: app, nav: nav } );
		this.copyDialog.close();
	},
	
	rightResized: function() {
		this.updateUrl();
		setTimeout( function() { Interop.fireEvent("RightResized"); } , 250 );
	}
	
	
});
});
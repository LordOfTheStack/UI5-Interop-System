/**
 * Static class that creates a virtual router that can run fiori applications in many sub-containers simultaneously
 * all they need is the BaseController base class on their views for the routing events to function correctly (they emulate standard fiori routing)
 * Container applications can register their container locations so that any app can navigate to a chosen container (eg: Left/Right/Header/Footer/Main/Master)
 * This class also provides methods for communicating between those applications (simplified version of EventBus, for ease of use)
 *
 * -originally created by Phillip Smith (Lord of the Stack) 2018
 *
 * - fallback support added, cookie support removed -PhillS June 2018
 * - classic cross-app navigate added for HANA (TODO: Add launchpad support too)
 * **/
jQuery.sap.declare("dalrae.ui5.routing.Interop");
jQuery.sap.require("dalrae.ui5.util.Functions");
jQuery.sap.require("dalrae.ui5.util.jQuery");
jQuery.sap.require("sap.ui.core.mvc.XMLView");


dalrae.ui5.routing.Interop = {

	//global settings
    UseCompression: true, //recommended (shortens the URL, and makes it less readable)
	UseFallbackRouting: true, //allow container navigation calls to fallback to standard routing if no containers exist (so Apps can still run standalone)
    mRestoreOnBrowserBack: false, //don't access this one directly, use the setter function provided, because javascript events need to be hooked
    
    //standard names, use them as much as possible, to help you keep your apps consistent
    StandardContainer: {
    	Main: "main",
    	Left: "left",
    	Right: "right",
    	Header: "header",
    	Footer: "footer",
    	Master: "master",
    	Inner: "inner"
    },
    
    StandardAction: {
    	OpenMaster: "OpenMaster",
    	CloseMaster: "CloseMaster",
    	Submit: "Submit"
    },
    
    StandardEvent: {
    	OnMasterOpen: "OnMasterOpen",
    	OnMasterClose: "OnMasterClose",
    	OnSubmit: "OnSubmit",
    	OnNavigate: "OnNavigate",
    	OnSessionRestored: "OnSessionRestored",
    	OnContainerCleared: "OnContainerCleared"
    },
    
    /**
     * @function registerNamespace (updated for HANA)
     * @description shorthand version of jQuery.sap.registerModulePath to import another app (saves you needing to specify your module path)
     * @param {string} namespace the namesapce of the app you are importing eg: "demo.client"
     * @param {string} [location] hana folder name or SAP BSP location of the app you are importing eg: "ZCLIENT"
     * @author Phillip Smith (Lord of the Stack)
     * **/
    registerNamespace: function(namespace, bsp) {
    	if(!dalrae.ui5.routing.Interop._ns) {
    		dalrae.ui5.routing.Interop._ns = jQuery.sap.getModulePath("dalrae.ui5");
    	}
    	jQuery.sap.registerModulePath(namespace, dalrae.ui5.routing.Interop._ns.replace("dalrae/ui5",(bsp || namespace).replace(".","/"))); //<- updated for hana, replace dalrae/ui5 with ZDALRAEUI5 (bsp name) for gateway systems
    },
    
    /**
     * @function registerContainer
     * @description register a container, so that it may be used for global application navigation (ie: an app can be run inside of it)
     * @param {dalrae.ui5.routing.Interop.StandardContainer} id the global id of this container, preferably select from the standard list, but a custom {string} is also acceptable. this will be needed for .navigateContainer
     * @param {sap.ui.core.Control} container any user control that has a contents aggregation (.addContent/.destroyContent), for instance a Panel. This library also contains a custom container control, which will call this method automatically if a name property is specified
     * @author Phillip Smith (Lord of the Stack)
     * **/
	registerContainer: function(id, container) {
		if(!dalrae.ui5.routing.Interop._cc) {
			dalrae.ui5.routing.Interop._cc = { };
		}
		dalrae.ui5.routing.Interop._cc[id] = { key: id, container: container, view: null };
	},
	
	/**
     * @function navigateContainer
     * @description a global cross-app version of router .navTo that also routes into the chosen globally registered container
     * @param {dalrae.ui5.routing.Interop.StandardContainer} id the container being navigated (the container this app should show up in). A custom {string} is also acceptable
     * @param {Object} params container navigation options
     * @param {string} params.app the namespace of the fiori application you are navigating to (eg: "dalrae.student")
     * @param {Array} params.nav the parameters normally sent to .navTo, which are route name, and route parameters for example ["student",{ studentid: "1234"}]
     * @param {bool} [params.showHeader] false by default, whether or not the application being routed shows its own page header. usually this is not desirable when rotuing to a container
     * @param {Object} [params.onNavigateTags] optional, any additional information to parse through the OnNavigate event as oEvent.getParameter("tags")
     * @author Phillip Smith (Lord of the Stack)
     * @example 
     * 
     *   Example1
     *   dalrae.ui5.routing.Interop.navigateContainer( dalrae.ui5.routing.Interop.StandardContainer.Main , {
     *												app: "dalrae.student",
     *												nav: ["student", {
     *													studentid: "1234"
     *												}]
     *											});
     * 
     *   Example2
     *   dalrae.ui5.routing.Interop.navigateContainer( "dialog" , {
     *												app: "dalrae.student",
     *												nav: ["student", {}],
     *												showHeader: true
     *											});
	 * **/
	navigateContainer: function(id, params) {
		if(dalrae.ui5.routing.Interop._cc && dalrae.ui5.routing.Interop._cc[id]) {
			var cc = dalrae.ui5.routing.Interop._cc[id];
			if(params.app) {
				params.name = params.app;
				delete params.app;
			}
			if(cc.app === params.name && cc.nav && cc.nav[0] === params.nav[0]) {
				//view already loaded, just call routematched in case parameters have changed
				console.log("No need to navigate container '" + id + "' because the requested route '" + cc.nav[0] + "' is already loaded there. OnRouteMatched will still be called (Interop)");
				cc.nav = params.nav;
				cc.restored = params._restoring;
				dalrae.ui5.routing.Interop._routeEvents(cc);
				return;
			}
			console.log("Navigating container '" + id + "' to route '" + params.nav[0] + "' of app '" + params.name + "' (Interop)");
			cc.container.setBusyIndicatorDelay(0);
			cc.container.setBusy(true);
			setTimeout(function() {
				if(cc.view && cc.nav && cc.nav[0] && cc.nav[0] !== params.nav[0]) {
					//destroy old view
					if(cc.controller && cc.controller.destroy) {
						dalrae.ui5.routing.Interop.detachEvents(cc.controller);
						cc.controller.destroy();
						delete cc.controller;
					}
					if(cc.view && cc.view.destroy) {
						cc.view.destroy();
						delete cc.view;
					}
				}
				if(cc.app && cc.app !== params.name) {
					//destroy old component
					if(cc.component && cc.component.destroy) {
						cc.component.destroy();
						delete cc.component;
					}
					if(cc.router) {
						delete cc.router;
					}
				}
				delete cc.iRouter;
				cc.app = params.name;
				cc.nav = params.nav;
				cc.showHeader = (params.showHeader === true);
				cc.restored = params._restoring;
				cc.onnavigatetags = params.onNavigateTags;
				dalrae.ui5.routing.Interop._navTo(cc);
			},10);
		} else {
			//invalid container id
			if(id === dalrae.ui5.routing.Interop.StandardContainer.Main && dalrae.ui5.routing.Interop.UseFallbackRouting) {
				//Fallback mode, no Main container found, so use classic routing (TODO: Add support for cross-app routing too, currently only supports the same app -PhillS)
				if(dalrae.ui5.routing.Interop.mFallbackRouter) {
					if(dalrae.ui5.routing.Interop._fallbackGetCurrentApp() === params.app) {
						console.log("Fallback routing, using standard navTo since containers exist. Navigating to route '" + params.nav[0] + "' (Interop)");
						dalrae.ui5.routing.Interop.mFallbackRouter.navTo( params.nav[0] , params.nav[1] ); //route using standard router within current app
					} else {
						console.log("Fallback routing, using legacy cross-app-navigation since no containers exist. Navigating to app '" + params.app + "' route '" + params.nav[0] + "' (Interop)");
						dalrae.ui5.routing.Interop._fallbackNavTo_Hana( params.app , params.nav[0] , params.nav[1] );
					}
				} else {
					console.error("Cannot navigate, trying to use classic routing but no fallback router was found, perhaps you forgot to inherit the dalrae.ui5.BaseController class on you view controller (Interop)");
				}
			} else {
				console.error("Cannot navigate, no registered container called '" + id + "' (Interop)");
			}
		}
	},
	
	/**
	 * @function clearContainer
	 * @description this function destroys the contents of a navigatable container, you normally won't use this, but it's available if needed
	 * @param {string} id The id of the container to be cleared (eg: "main")
	 * @param {Object} [tags] optional, any additional information to parse through the OnContainerCleared event as oEvent.getParameter("tags")
	 * @author Phillip Smith (Lord of the Stack)
	 * **/
	clearContainer: function(id,tags) {
		if(dalrae.ui5.routing.Interop._cc && dalrae.ui5.routing.Interop._cc[id]) {
			var cc = dalrae.ui5.routing.Interop._cc[id];
			if(cc.view) {
				if(cc.controller && cc.controller.destroy) {
					dalrae.ui5.routing.Interop.detachEvents(cc.controller);
					cc.controller.destroy();
					delete cc.controller;
				}
				if(cc.view && cc.view.destroy) {
					cc.view.destroy();
					delete cc.view;
				}
				if(cc.component && cc.component.destroy) {
					cc.component.destroy();
					delete cc.component;
				}
				if(cc.router) {
					delete cc.router;
				}
				cc.onnavigatetags = tags;
				cc.container.destroyContent();
				delete cc.app;
				delete cc.view;
				delete cc.nav;
				delete cc.viewpath;
				delete cc.iRouter;
				dalrae.ui5.routing.Interop.raiseEvent(dalrae.ui5.routing.Interop.StandardEvent.OnContainerCleared, { container: id, sessionRestore: cc.restored, tags: tags });
				console.log("Cleared container '" + id + "' (Interop)");
			}
		}
	},
	
	clearAllContainers: function() {
		if(dalrae.ui5.routing.Interop._cc) {
			for(var p in dalrae.ui5.routing.Interop._cc) {
				dalrae.ui5.routing.Interop._cc[p].restored = false;
				dalrae.ui5.routing.Interop.clearContainer(p);
			}
		}
	},
	
	//internal method for navigateContainer
	_navTo: function(containerinfo,params) {
		var cc = containerinfo;
		if(!cc.component) {
			dalrae.ui5.routing.Interop._invadeCore();
			var cpath = cc.app + ".Component";
			jQuery.sap.require(cpath);
			var constructor = dalrae.ui5.util.Functions.stringToFunction(cpath);
			cc.component = new constructor();
			cc.models = dalrae.ui5.routing.Interop._getModels( cc.component );
		}
		var comp = cc.component;
		var router = comp.getRouter();
		var route = router.getRoute(cc.nav[0]);
		cc.router = router;
		
		if(!route) {
			console.error("Cannot navigate, no route named '" + cc.nav[0] + "' found in app '" + cc.app + "' (Interop)");
			return;
		}
		
		//resolve view path
		var viewpath = "";
		if(route._oConfig.view) {
			//classic routing
			viewpath = router._oConfig.viewPath + "." + route._oConfig.view;
		} else if(route._oConfig.target) {
			//manifest file
			if(Array.isArray(route._oConfig.target)) {
				//master detail route, which should we use?
				if(cc.key === dalrae.ui5.routing.Interop.StandardContainer.Master) {
					viewpath = router.getTarget(route._oConfig.target[0])._oOptions.viewPath + "." + router.getTarget(route._oConfig.target[0])._oOptions.viewName;
				} else {
					viewpath = router.getTarget(route._oConfig.target[1])._oOptions.viewPath + "." + router.getTarget(route._oConfig.target[1])._oOptions.viewName;
				}
			} else {
				//single view route
				viewpath = router.getTarget(route._oConfig.target)._oOptions.viewPath + "." + router.getTarget(route._oConfig.target)._oOptions.viewName;
			}
		}
		
		if(cc.viewpath != viewpath) {
			dalrae.ui5.routing.Interop._lastRoute = cc;
			cc.viewpath = viewpath;
			//cc.component.runAsOwner(function() { //seems to be no point in doing this, doesn't make component bindings work, only serves to make it harder to identify whats my route and whats standard route -PhillS
	        cc.view = new sap.ui.core.mvc.XMLView({
                viewName: viewpath
            });
			//}.bind(this));
	        cc.controller = cc.view.getController();
	        cc.view.getController()._interop_container = cc.key;
	        cc.view.setHeight("100%");
	        if(cc.view.getContent().length > 0 && cc.view.getContent()[0].setShowHeader) {
	        	//by default, we remove page headers from the view, since it's inside a container, 
	        	//but it can be turned back on with the showHeader option in navigateContainer -PhillS
	        	cc.view.getContent()[0].setShowHeader(cc.showHeader); 
	        }
	        cc.container.destroyContent();
			cc.container.addContent(cc.view);
			dalrae.ui5.routing.Interop._addModels(cc);
			dalrae.ui5.routing.Interop._routeEvents(cc);
		}
	},
	
	_navSubview: function(targets,targetname) {
		//this is a special navigation method for lazy loading tabs in fiori 2.0
		//this enabeld the syntax of .getRouter().getTargets().display("AccessTab"); which will load a subview into another control -PhillS
		var target = targets._mTargets[targetname];
		var cc = targets.mCC;
		var options = target._oOptions;
		
		
		var targetelement = cc.view.byId(options.controlId);
		if(targetelement.getAggregation(options.controlAggregation).length > 0) {
			console.log("Lazy Load route target '" + options.name + "' already loaded inside container '" + cc.key + "', no events fired (Interop)");
		} else {
			console.log("Lazy Load route target '" + options.name + "', target ui element '" + options.controlId + "' inside container '" + cc.key + "', RouteMatched fired for subview (Interop)");
			dalrae.ui5.routing.Interop._lastRoute = null;
			dalrae.ui5.routing.Interop._subRoute = cc;
			
			//resolve view path (only one scenario for this one, great!)
			var viewpath = options.viewPath + "." + options.viewName;
			var subview = new sap.ui.core.mvc.XMLView({
	            viewName: viewpath
	        });
			
			targetelement.addAggregation(options.controlAggregation,subview);
			dalrae.ui5.routing.Interop._routeEvents(cc,true);
		}
		
	},
	
	/**
	* @function _fallbackNavTo_Hana
	* @description internal method for cross app navigating (legacy mode / falback) within hana or IIS or any other normal webserver
	* @author Phillip Smith (Lord of the Stack)
	**/
	_fallbackNavTo_Hana: function(app,route,params) {
		dalrae.ui5.routing.Interop.registerNamespace(app); //since this is hana, we can simply register the namespace without needing to know any additional info (unlike gateway) -PhillS
		var deeplink = dalrae.ui5.routing.Interop._generateDeepLinkURL(app,route,params);
		var appUrl = window.location.href;
		var i = appUrl.toLowerCase().indexOf(".html");
		if(i === -1) {
			i = appUrl.toLowerCase().indexOf(".htm");
			if(i > -1) {
				i += 4;
			}
		} else {
			i += 5;
		}
		if(i === -1) {
			var i1 = appUrl.toLowerCase().indexOf("?");
			var i2 = appUrl.toLowerCase().indexOf("#");
			if(i1 > -1 && i2 > -1) {
				i = Math.min(i1,i2);
			} else if(i1 > -1) {
				i = i1;
			} else if(i2 > -1) {
				i = i2;
			}
		}
		if(i === -1) {
			i = appUrl.toLowerCase().lastIndexOf("/") + 1;
		}
		appUrl = appUrl.substr(0,i);
		appUrl = appUrl.replace( dalrae.ui5.routing.Interop._fallbackGetCurrentApp().replace(".","/") , app.replace(".","/") );
		window.location.href = appUrl + deeplink;
	},
	_fallbackGetCurrentApp: function() {
		var vp = dalrae.ui5.routing.Interop.mFallbackRouter._oConfig.viewPath;
		var vpp = vp.split(".");
		return vpp[0] + "." + vpp[1];
	},
	
	/**
	* @function _generateDeepLinkURL
	* @description internal method, used to create external deeplink urls for classic routing. useful for when containers aren't being used (standalone mode)
	* @author Phillip Smith (Lord of the Stack)
	**/
	_generateDeepLinkURL: function(app,route,params) {
		if(!dalrae.ui5.routing.Interop._semantics) {
			dalrae.ui5.routing.Interop._semantics = [];
		}
		if(!dalrae.ui5.routing.Interop._semantics[app]) {
			dalrae.ui5.routing.Interop._semantics[app] = { cache: {} };
		}
		var cc = dalrae.ui5.routing.Interop._semantics[app].cache;
		if(!cc.component) {
			dalrae.ui5.routing.Interop._invadeCore();
			var cpath = app + ".Component";
			jQuery.sap.require(cpath);
			var constructor = dalrae.ui5.util.Functions.stringToFunction(cpath);
			cc.component = new constructor();
		}
		var comp = cc.component;
		var oRouter = comp.getRouter();
		var oRoute = oRouter.getRoute(route);
		cc.router = oRouter;
		dalrae.ui5.routing.Interop._semantics[app].cache = cc;
		
		if(!oRoute) {
			console.error("Cannot create deeplink, no route named '" + route + "' found in app '" + app + "' (Interop)");
			return;
		}
		
		var url = oRoute.pattern;
		if(url) {
			for(var p in params) {
				url = url.replace("{" + p + "}",params[p]).replace(":" + p + ":",params[p]);
			}
			
			//return "&/" + url; //launchpad
			return "#/" + url; //HANA
		} else {
			return "";
		}
			
	},
	
	_getModels: function(component) {
		//i need to work out where to find sap.ui.getCore() models, they're hidden somewhere, TREASURE HUNT!!
		//for now, i can at least grab the component bound ones, so that they can be added to the routed views associated with that component
		var models_c = {};
		var models_g = $(dalrae.ui5.routing.Interop.__models).copy() || {};
		if(component.getModel && component.oModels) {
			models_c = component.oModels;
		}
		for(var m in models_c) {
			models_g[m] = models_c[m]; //component beats core
		}
		component._coreModels = models_g;
		return component._coreModels;
	},
	_addModels: function(cc) {
		if(cc.models) {
			for(var m in cc.models) {
				if(m === "undefined") { //default
					//if(!cc.view.getModel()) {
						cc.view.setModel( cc.models[m] ); //i know this seems like parsing null should be the same, but it isnt, the mere presence of an argument changes this methods behaviour
					//}
				} else {
					//if(!cc.view.getModel(m)) {
						cc.view.setModel( cc.models[m] , m );
					//}
				}
			}
		}
	},
	_invadeCore: function() {
		//There is some extremely clever interfacing code in play around sap.ui.getCore() that absolutely prevents me gaining access to its internals
		//unfortunately they never provided a means of listing all models available in .getModel, so since .oModels (an internal member) is blocked
		//we need to wrapper the core object constructor to capture all .setModel calls (go forth! invade the core!) -PhillS
		//DO NOT MODIFY THIS FUNCTION IF YOU ARE INEXPERIENCED WITH SAPUI5! (or do, whatever) -PhillS
		if(!dalrae.ui5.routing.Interop.__core) {
			dalrae.ui5.routing.Interop.__models = {};
			dalrae.ui5.routing.Interop.__core = sap.ui.getCore();
			dalrae.ui5.routing.Interop.__setModel = dalrae.ui5.routing.Interop.__core.setModel;
			dalrae.ui5.routing.Interop.__core.setModel = function(){ //wrap setModel so we can record every model name used
				dalrae.ui5.routing.Interop.__setModel.apply(dalrae.ui5.routing.Interop.__core,arguments);
				dalrae.ui5.routing.Interop.__models[arguments[1] || "undefined"] = arguments[0];
			}
			sap.ui.getCore = function() {
				return dalrae.ui5.routing.Interop.__core;
			}
		}
	},
	
	//internal method for firing off OnRouteMatched events for legacy compatibility with standard fiori apps
	_routeEvents: function(cc,subview) {
		if(cc.iRouter) { 
			var routeEvent = {
				mParameters: {
					name: cc.nav[0],
					arguments: cc.nav[1],
					container: cc.key,
					sessionRestore: cc.restored
				},
				oSource: cc.route,
				getParameter: function(p) {
					return this.mParameters[p];
				},
				getParameters: function() {
					return this.mParameters;
				},
				getSource: function() {
					return this.oSource;
				}
			}
			if(routeEvent.mParameters.arguments.query) { //not sure why they do this, but they do... so handle it
				routeEvent.mParameters.arguments["?query"] = routeEvent.mParameters.arguments.query;
			}
	
			try {
				cc.iRouter._handlersCount = cc.iRouter.mEventHandlers.length;
				$(cc.iRouter.mEventHandlers).each(function(){
					this(routeEvent);
				});
				
			} catch(err) {
				console.log(err);
			}
			
			if(cc.iRouter.mRoutes[cc.nav[0]]) {
				try {
					if(subview) {
						var cnt = cc.iRouter.mRoutes[cc.nav[0]].mEventHandlers.length;
						var ocnt = cc.iRouter.mRoutes[cc.nav[0]]._handlersCount;
						cc.iRouter.mRoutes[cc.nav[0]]._handlersCount = cnt;
						if(cnt > ocnt) {
							for(var i = cnt - ocnt; i < cnt; i++) {
								cc.iRouter.mRoutes[cc.nav[0]].mEventHandlers[i](routeEvent);
							}
						}
					} else {
						cc.iRouter.mRoutes[cc.nav[0]]._handlersCount = cc.iRouter.mRoutes[cc.nav[0]].mEventHandlers.length;
						$(cc.iRouter.mRoutes[cc.nav[0]].mEventHandlers).each(function(){
							this(routeEvent);
						});
					}
				} catch(err) {
					console.log(err);
				}
			}
		}
		dalrae.ui5.routing.Interop.raiseEvent(dalrae.ui5.routing.Interop.StandardEvent.OnNavigate, {
			app: cc.app,
			name: cc.nav[0],
			arguments: cc.nav[1],
			container: cc.key,
			sessionRestore: cc.restored,
			tags: cc.onnavigatetags
		});
		cc.container.setBusy(false);
	},
	
	/**
	 * @function getRouterFor
	 * @description intended as a replacement for sap.ui.core.UIComponent.getRouterFor which enables Interop to override standard routing by creating its own router proxy objects
	 *				in theory, this is the only non-standard line of code needed to enable Interop in your app (which is already done for you if you inherit GenericController)
	 *				this router also provides legacy functionality for .navTo which will behave like the classic router but actually use Interop containers
	 * @returns {Object} a proxy router object that replaces the bare minimum features of sap.m.routing.Router (it is incomplete, but I continue to add more features as scenarious arrise out in the field)
	 * @author Phillip Smith (Lord of the Stack)
	 **/
	getRouterFor: function(controller) {
		if(!dalrae.ui5.routing.Interop._cc) {
			return null;
		}
		var cc = dalrae.ui5.routing.Interop._cc[controller._interop_container];
		var subview = false;
		if(!cc) {
			//maybe we just created it and this is its onInit() function, in which case we havent had a chance to record it yet (because the constructor is halfway through firing)
			//so we need to locate the panel with the matching view path of the one requesting its router
			for(var p in dalrae.ui5.routing.Interop._cc) {
				var icc = dalrae.ui5.routing.Interop._cc[p];
				if(icc.viewpath === controller.getView().sViewName && !icc.iRouter) {
					cc = icc;
					controller._interop_container = cc.key;
				}
			}
			if(!cc) {
				//last resort, assume its the last instantiated route
				cc = dalrae.ui5.routing.Interop._lastRoute;
				if(cc) {
					controller._interop_container = cc.key;
					//dalrae.ui5.routing.Interop._lastRoute = null; //clearing it out breaks subview (the subviews controllers get instantiated BEFORE their parents, weirdly)
				}
			}
			if(!cc) {
				cc = dalrae.ui5.routing.Interop._subRoute;
				if(cc) {
					subview = true;
					controller._interop_container = cc.key;
				}
			}
		}
		if(cc) {
			var router = controller._router;
			if(subview) {
				router = cc.iRouter;
				controller._router = router;
			}
			if(!router) {
				router = {
					container: cc.key,
					app: cc.app,
					navTo: function(name,params) {
						if(this.container === dalrae.ui5.routing.Interop.StandardContainer.Master) {
							//Master lists will typically be navigating the Main container, not their own container, so we can safely assume this is the case for this legacy function
							dalrae.ui5.routing.Interop.navigateContainer(dalrae.ui5.routing.Interop.StandardContainer.Main, { app: this.app, nav: [name,params] });
						} else {
							//legacy navTo should navigate the views current container (so that a legacy app can run independently)
							dalrae.ui5.routing.Interop.navigateContainer(this.container, { app: this.app, nav: [name,params] });
						}
					},
					attachRouteMatched: function(fn,context) {
						if(context) {
							this._routeMatchedFn = jQuery.proxy(fn,context);
						} else {
							this._routeMatchedFn = fn;
						}
						this.mEventHandlers.push(this._routeMatchedFn);
					},
					attachRoutePatternMatched: function(fn,context) { 
						if(context) {
							this._routeMatchedFn = jQuery.proxy(fn,context);
						} else {
							this._routeMatchedFn = fn;
						}
						this.mEventHandlers.push(this._routeMatchedFn);
					},
					mTargets: cc.router._oTargets,
					mComponent: cc.component,
					mCC: cc,
					getComponent: function() {
						return this.mComponent;
					},
					mRoutes: {},
					mEventHandlers: [],
					getRoute: function(routename) {
						var routeobject = this.mRoutes[routename];
						if(!routeobject) {
							routeobject = {
								name: routename,
								mEventHandlers: [],
								attachPatternMatched: function(fn,context) {
									if(context) {
										this._routeMatchedFn = jQuery.proxy(fn,context);
									} else {
										this._routeMatchedFn = fn;
									}
									this.mEventHandlers.push(this._routeMatchedFn);
								},
								attachMatched: function(fn,context) {
									if(context) {
										this._routeMatchedFn = jQuery.proxy(fn,context);
									} else {
										this._routeMatchedFn = fn;
									}
									this.mEventHandlers.push(this._routeMatchedFn);
								}
							}
							this.mRoutes[routename] = routeobject;
						}
						return routeobject;
					},
					getTargets: function() {
						var targets = this.mTargets;
						targets.mCC = this.mCC;
						targets.display = function(targetname) {
							dalrae.ui5.routing.Interop._navSubview(this,targetname); //lazy loading functionality
						}
						return targets;
					}
				}
				cc.iRouter = router;
				controller._router = router;
			}
			return router;
		} else {
			//can't find it, give up
			return null;
		}
	},
	
	/***
	 * @function getContainer
	 * @description retrieve the container UI control that's registered with the current id
	 * @returns {sap.ui.Core.Control} the registered container control, or null
	 * @author Phillip Smith (Lord of the Stack)
	 * **/
	getContainer: function(id) {
		if(dalrae.ui5.routing.Interop._cc && dalrae.ui5.routing.Interop._cc[id]) {
			return dalrae.ui5.routing.Interop._cc[id].container;
		}
		return null;
	},
		
	/***
	 * @function getCurrentRoute
	 * @description retrieve the current internal routing information of the given container
	 * @returns {Object} the object used by Interop that maintains this route. given as is, use at your own risk
	 * @author Phillip Smith (Lord of the Stack)
	 * **/
	getCurrentRoute: function(id) {
		if(dalrae.ui5.routing.Interop._cc && dalrae.ui5.routing.Interop._cc[id]) {
			return dalrae.ui5.routing.Interop._cc[id];
		}
		return null;
	},
	
	/**
	 * @function attachEvent
	 * @description listen to a global event
	 * @param {string} event the name of the event to listen out for, preferably from the Interop.StandardEvent or Interop.StandardAction list, but a custom string is acceptable
	 * @param {function} fn the javascript function that will be called for this listener
	 * @param {Object} [context] optional context object to ensure the 'this' object is what you expect it to be.
	 * @example
	 *		Interop.attachEvent( Interop.StandardEvent.OnMasterOpen, this.onMasterOpen, this );
	 * @author Phillip Smith (Lord of the Stack)
	 * **/
	attachEvent: function(event, fn, context) {
		if(!context) {
			context = this;
		}
		if(!dalrae.ui5.routing.Interop._listeners) {
			dalrae.ui5.routing.Interop._listeners = {}
			dalrae.ui5.routing.Interop._listenerIID = 0;
		}
		if(!dalrae.ui5.routing.Interop._listeners[event]) {
			dalrae.ui5.routing.Interop._listeners[event] = [];
		}
		var iid = ++dalrae.ui5.routing.Interop._listenerIID;
		dalrae.ui5.routing.Interop._listeners[event].push({ iid: iid, fn: fn, context: context});
		if(!context._interop) {
			context._interop = { };
		}
		if(!context._interop.events) {
			context._interop.events = [];
		}
		context._interop.events.push({ event: event, iid: iid }); 
	},
	
	detachEvents: function(context) {
		if(!context) {
			context = this;
		}
		if(context._interop && context._interop.events) {
			$(context._interop.events).each(function() {
				var evr = this;
				var ev = dalrae.ui5.routing.Interop._listeners[evr.event];
				for(var i = 0; i < ev.length; i++) {
					if(ev[i].iid == evr.iid) {
						ev.splice(i,1);
						break;
					}
				}
			});
		}
	},
	
	/**
	 * @function raiseEvent
	 * @description trigger thisevent to all active listeners
	 * @param {string} event the event name, eg a value from Interop.StandardEvent or a string like "press"
	 * @param {object} [params] optional parameters carried with this event for the listener to read
	 * @param {object} [source] optional object that raised this event, so that listener can use .getSource()
	 * @author Phillip Smith (Lord of the Stack)
	 * **/
	raiseEvent: function(event, params, source) {
		if(dalrae.ui5.routing.Interop._listeners && dalrae.ui5.routing.Interop._listeners[event]) {
			for(var i = 0; i < dalrae.ui5.routing.Interop._listeners[event].length; i++) {
				var eventfn = dalrae.ui5.routing.Interop._listeners[event][i];
				//generate an object that is consistent with normal UI control events in fiori (this is why we aren't using eventbus) -PhillS
				try {
					jQuery.proxy(eventfn.fn,eventfn.context)({
						sId: event,
						oSource: source || dalrae.ui5.routing.Interop,
						oContext: eventfn.context,
						mParameters: params,
						getParameters: function() {
							return this.mParameters;	
						},
						getParameter: function(p) {
							return this.mParameters[p];
						},
						getSource: function() {
							return this.oSource;
						}
					});
				} catch(err) {
					console.error(err);
				}
			}
		}
	},
	fireEvent: function(event, params, source) {
		dalrae.ui5.routing.Interop.raiseEvent(event,params,source);
	},
	
	/**
	 * @function restoreSession
	 * @description call this on the startup of your container app to allow all its navigation to be restored from the previous session (ie: when F5 is pressed)
	 *				be sure to call 'saveSession' after evry navigation event in order for this to work
	 *				this function reads a url parameter which corresponds to a cookie
	 * @returns {Object} returns an object containing a bool 'restored' true/false indicating if a session was restored, and an object 'extraStateExtra' if anything was parsed in saveSession
	 * @author Phillip Smith (Lord of the Stack)
	 * **/
	restoreSession: function(session) {
		var result = { restored: false, extraStateInfo: null, navs: null };
		if(!session) {
			
			var nav = dalrae.ui5.routing.Interop._getUrlParam("nav");
			if(nav) {
				session = dalrae.ui5.routing.Interop._urlToSession(nav);
			}
			
		}
		if(session) {
			console.log("Restoring navigation session (Interop)");
			result.restored = true;
			result.extraStateInfo = session.extra;
			result.navs = session.navs;
			for(var i = 0; i < result.navs.length; i++) {
				var n = result.navs[i];
				if(n.module && n.module.path) {
					jQuery.sap.registerModulePath(n.module.namespace,n.module.path);
				}
				n.navTo._restoring = true;
				dalrae.ui5.routing.Interop.navigateContainer(n.container,n.navTo);
			}
			for(var c in dalrae.ui5.routing.Interop._cc) {
				var cc = dalrae.ui5.routing.Interop._cc[c];
				var hasNav = false;
				for(var i = 0; i < result.navs.length; i++) {
					if(result.navs[i].container === cc.key) {
						hasNav = true;
					}
				}
				if(!hasNav) {
					cc.restored = true;
					dalrae.ui5.routing.Interop.clearContainer(cc.key);
				}
			}
			dalrae.ui5.routing.Interop.raiseEvent(dalrae.ui5.routing.Interop.StandardEvent.OnSessionRestored,result);
		}
		return result;
	},
	
	/**
	 * @function setRestoreOnBrowserBack
	 * @description when set to True, the Interop.restoreSession() function will get called when the user presses Back on their browser
	 * @param {bool} flag On or Off. default is off, so you must call this once to enable it
	 * @author Phillip Smith (Lord of the Stack)
	 * **/
	setRestoreOnBrowserBack: function(flag) {
		dalrae.ui5.routing.Interop.mRestoreOnBrowserBack = (flag === true);
		if(!window._onbrowserback) {
			//absolutely only do this once!
			window._onbrowserback = true;
			window.addEventListener('popstate', function(event){
				if(dalrae.ui5.routing.Interop.mRestoreOnBrowserBack) {
					if(dalrae.ui5.routing.Interop._getHashRef() === "#Shell-home") {
						console.log("return to laucnhpad home detected. clearing url session (Interop)");
						dalrae.ui5.routing.Interop._clearUrlParam( "nav" );
					} else if(dalrae.ui5.routing.Interop._getHashRef() !== dalrae.ui5.routing.Interop._lastHashRef) {
						console.log("navigation to different BSP detected. clearing url session (Interop)");
						dalrae.ui5.routing.Interop._clearUrlParam( "nav" );
					} else {
						console.log("browser back button detected, restoring url: " + window.location.href + " (Interop)");
						if(!dalrae.ui5.routing.Interop.restoreSession(null).restored) {
							dalrae.ui5.routing.Interop.clearAllContainers();
						}
					}
				}
			});
			
			if(dalrae.ui5.util.Functions.isMicrosoftBrowser()) {
				//microsoft browsers don't trigger popstate when the fiori laucnhpad home button is pressed, so we need an additional event for that
				window.addEventListener('hashchange',function(event){
					if(dalrae.ui5.routing.Interop.mRestoreOnBrowserBack) {
						if(dalrae.ui5.routing.Interop._getHashRef() === "#Shell-home") {
							console.log("return to laucnhpad home detected. clearing url session (Interop)");
							dalrae.ui5.routing.Interop._clearUrlParam( "nav" );
						} else if(dalrae.ui5.routing.Interop._getHashRef() !== dalrae.ui5.routing.Interop._lastHashRef) {
							console.log("navigation to different BSP detected. clearing url session (Interop)");
							dalrae.ui5.routing.Interop._clearUrlParam( "nav" );
						}
					}
				},false);
			}
		}
	},
	
	/**
	 * @function saveSession
	 * @description save current navigation params of all containers so they may be restroed later (ie: when the user hits F5)
	 * @param {Object} [extra] optional parameter that lets you save additional information into the session cookie, the object saved here will get returned by restoreSession
	 * @author Phillip Smith (Lord of the Stack)
	 * **/
	saveSession: function(extraStateInfo) {
		if(dalrae.ui5.routing.Interop._cc) {
			var token = dalrae.ui5.routing.Interop._getRandHash();
			var session = dalrae.ui5.routing.Interop.getSession(extraStateInfo);
			
			dalrae.ui5.routing.Interop._setUrlParam("nav",dalrae.ui5.routing.Interop._sessionToUrl(session));
			
			return session;
		}
		return null;
	},
	/***
	 * @function getSession
	 * @description like saveSession except it just returns an object of the sesssion and doesn't save it anywhere, leaving it up to you where you want to save it. 
	 *				the object created by this can be optionally parsed into restoreSession
	 * @author Phillip Smith (Lord of the Stack)
	 * **/
	getSession: function(extraStateInfo) {
		if(dalrae.ui5.routing.Interop._cc) {
			var token = dalrae.ui5.routing.Interop._getRandHash();
			var navs = [];
			for(var p in dalrae.ui5.routing.Interop._cc){
				var cc = dalrae.ui5.routing.Interop._cc[p];
				if(cc.app) {
					navs.push({
						container: cc.key,
						navTo: { 
							app: cc.app,
							nav: cc.nav
						},
						module: {
							namespace: cc.app,
							path: jQuery.sap.getModulePath(cc.app)
						}
					});
				}
			}
			var session = { navs: navs, extra: extraStateInfo };
			return session;
		}
		return null;
	},
	
	
	//internal methods for save/load session from url/cookie
	_getRandHash: function() {
		var r = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 6);
		return r;
	},
	_getUrlParam: function(p) {
		var results = new RegExp('[\?&]' + p + '=([^&#]*)').exec(window.location.href);
	    if (results==null){
	       return null;
	    }
	    else{
	       return decodeURI(results[1]) || 0;
	    }
	},
	_setUrlParam: function(p,val) {
		var url = window.location.href;
		var i = url.indexOf("?" + p + "=");
		if(i === -1) {
			i = url.indexOf("&" + p + "=");
		}
		var newurl;
		if(i === -1) {
			//new param
			i = url.indexOf("?");
			var urlpart = (i > -1 ? "&" : "?") + p + "=" + encodeURI( val );
			var h = url.lastIndexOf("#"); //launchpad uses local# ref for routes, our param must be before that
			if(h > -1) {
				newurl = url.substr(0,h) + urlpart + url.substr(h,url.length-1);
			} else {
				newurl = url + urlpart;
			}
		} else {
			//existing param
			var find = p + "=" + encodeURI( dalrae.ui5.routing.Interop._getUrlParam(p) );
			newurl = url.replace(find,p + "=" + encodeURI( val ));
		}
		if(url !== newurl) {
			if(!dalrae.ui5.routing.Interop._pushid) {
				dalrae.ui5.routing.Interop._pushid = 0;
			}
			window.history.pushState({path: newurl, iid: dalrae.ui5.routing.Interop._pushid++},'',newurl); //change url without reloading page
			dalrae.ui5.routing.Interop._lastHashRef = dalrae.ui5.routing.Interop._getHashRef();
		}
	},
	_clearUrlParam: function(p) {
		var url = window.location.href;
		var i = url.indexOf("?" + p + "=");
		var c = "?";
		if(i === -1) {
			i = url.indexOf("&" + p + "=");
			c = "&";
		}
		var newurl;
		if(i > -1) {
		
			//existing param
			var find = c + p + "=" + encodeURI( dalrae.ui5.routing.Interop._getUrlParam(p) );
			newurl = url.replace(find,"");
			if(c === "?") {
				newurl = newurl.replace("&","?"); //promote the next & if it exists
			}
			if(!dalrae.ui5.routing.Interop._pushid) {
				dalrae.ui5.routing.Interop._pushid = 0;
			}
			window.history.pushState({path: newurl, iid: dalrae.ui5.routing.Interop._pushid++},'',newurl); //change url without reloading page
		}
	},
	_sessionToUrl: function(session) {
		var str = "";
		var words = []; //keep track of potentially repeated words, this will be used to compress the url length at the end (faster than bruteforcing every character combination of the string at the end)
		$(session.navs).each(function(){
			var n = this;
			var s = n.container + "~" + n.navTo.app + "~" + n.navTo.nav[0];
			var s2 = ""
			for(var p in n.navTo.nav[1]) {
				var pval = n.navTo.nav[1][p].toString().replace("~","");
				var tmp = "~" + p + "~" + pval;
				s2 += tmp
				if(dalrae.ui5.routing.Interop.UseCompression) {
					words.push(tmp);
					words.push(pval);
					words.push(p);
					words.push(p + "~" + pval);
					words.push("~" + pval);
				}
			}
			s += s2;
			if(dalrae.ui5.routing.Interop.UseCompression) {
				words.push(s2);
				words.push(n.navTo.app);
				words.push(n.navTo.nav[0]);
				words.push(n.container);
				words.push(n.navTo.app + "~" + n.navTo.nav[0]);
				if(n.navTo.app.indexOf(".") > -1) {
					words.push(n.navTo.app.split(".")[0] + ".");
				}
			}
			str += s + "|";
		});
		if(session.extra) {
			str += "$";
			var f = true;
			for(var p in session.extra) {
				var pval = session.extra[p].toString().replace("~","");
				str += (f == true ? "" : "~") + p + "~" + pval;
				f = false;
				if(dalrae.ui5.routing.Interop.UseCompression) {
					words.push(p);
					words.push(pval);
					words.push("~" + pval);
				}
			}
		} else if(str.length > 0) {
			str = str.substr(0,str.length-1);
		}
		if(dalrae.ui5.routing.Interop.UseCompression) {
			str = dalrae.ui5.routing.Interop._compressUrl( str , words );
		} 
		return encodeURIComponent( str );
	},
	_urlToSession: function(url) {
		var session = { navs: [], extra: null };
		var decoded = dalrae.ui5.routing.Interop._decompressUrl( decodeURIComponent(url) );
		var data = decoded.split("|");
		$(data).each(function(){
			var str = this.toString();
			if(str[0] === "$") {
				//extra state info
				session.extra = {};
				var parts = str.substr(1,str.length-1).split("~");
				for(var i = 0; i < parts.length; i += 2) {
					if(i + 1 < parts.length) {
						session.extra[parts[i]] = parts[i+1];
					}
				}
			} else {
				//route info
				var parts = str.toString().split("~");
				var nav = { 
					container: parts[0],
					navTo: {
						app: parts[1],
						nav: [
							parts[2],
							{}
						]
					}
				};
				for(var i = 3; i < parts.length; i += 2) {
					if(i + 1 < parts.length) {
						nav.navTo.nav[1][parts[i]] = parts[i+1];
					}
				}
				session.navs.push(nav);
			}
		});
		return session;
	},
	_compressUrl: function(str,words) {
		var url = str;
		var prefix = "";
		var processed = [];
		var next = 0;
		words = words.sort(function(a, b){ return b.length - a.length; }); //sort, longest words first
		for(var i = 0; i < words.length; i++) {
			var word = words[i];
			if(processed.indexOf(word) === -1 && word.length > 3) {
				var cnt = 0;
				var i = url.indexOf(word);
				while(i > -1) {
					cnt++;
					i = url.indexOf(word,i+1);
				}
				if(cnt > 1) {
					//repeated long word
					var iid = String.fromCharCode(65 + next++);
					if(prefix.length > 0) {
						prefix += "!";
					}
					prefix += iid + word;
					while(url.indexOf(word) > -1) {
						url = url.replace(word,"!" + iid);
					}
				}
				processed.push(word);
			}
		}
		if(prefix.length > 0) {
			var url2 = "|" + prefix + "|" + url;
			if(url2.length + 4 < str.length) {
				return url2; //success
			} else {
				return str; //unable to compress, no gain
			}
		} else {
			return url; //unable to compress, no significant repeated words
		}
	},
	_decompressUrl: function(str) {
		var url = str;
		if(str[0] === '|') {
			//decompress 
			var e = url.indexOf("|",1);
			var prefix = url.substr(1,e-1);
			url = url.substr(e+1,url.length);
			var vars = prefix.split("!");
			for(var v = 0; v < vars.length; v++) {
				var vstr = vars[v].toString();
				var iid = "!" + vstr[0];
				var val = vstr.substr(1);
				while(url.indexOf(iid) > -1) {
					url = url.replace(iid,val);
				}
			}
		}
		return url;
	},
	
	_getHashRef: function() {
		var str = window.location.href;
		var i = str.indexOf('#');
		if(i > -1) {
			return str.substr(i);
		} else {
			return "";
		}
	}
	

	
};
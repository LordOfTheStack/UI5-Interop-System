sap.ui.define([
	"dalrae/ui5/BaseController",
	'sap/ui/model/Filter',
	'sap/ui/model/json/JSONModel',
	'dalrae/ui5/routing/Interop',
	'sap/m/MessageToast'

], function(GenericController, Filter, JSONModel, Interop, MessageToast) {

	"use strict";
	return GenericController.extend("sample.container.view.panels.ProcessFlow", {

		onInit: function() {
			this.loadReferenceData();

			this.getView().addStyleClass("sapUiSizeCompact");
			this.getRouter().attachRouteMatched(this._onRouteMatched, this);

			Interop.attachEvent(Interop.StandardEvent.OnNavigate, this.onNavigate, this);
		},
		onNavigate: function(oEvent) {
			var name = oEvent.getParameter("name");
			var app = oEvent.getParameter("app");

			this.bindView();

			//perform after bind
			var workflowSteps = this.getWorkflowSteps(this.WorkflowId);
			var ws = $.grep(workflowSteps.Steps, function(item) {
				return item.nav === name && item.app === app;
			});
			if (ws && ws.length > 0) {
				var workflowStep = ws[0];

				//set the control to this record being selected.
				var processStepBar = this.getView().byId("processStepBar");
				if (processStepBar) {
					processStepBar.setSelected(workflowStep.number);
				}
			}
		},
		_onRouteMatched: function(oEvent) {
			if (oEvent.getParameter("container") === Interop.StandardContainer.Header) {
				Interop.fireEvent("setHeaderHeight", {
					height: "150px"
				});
			}

			this.ContainerName = oEvent.getParameter("container");
			var workflowName = oEvent.getParameters().arguments.workflow;
			var workflows = this.getWorkflows();
			if (workflows && workflows.workflows) {
				var wfs = $.grep(workflows.workflows, function(item) {
					return item.processCode === workflowName;
				});
				if (wfs && wfs.length > 0) {
					var workflow = wfs[0];
					this.WorkflowId = workflow.id;
				}
			}

			this.bindView();

			//check if there is an existing route in the main container
			var workflowSteps = this.getWorkflowSteps(this.WorkflowId);
			var mainContainerRoute = Interop.getCurrentRoute(Interop.StandardContainer.Main);
			var foundRoute = false;
			if (mainContainerRoute) {
				if (mainContainerRoute.app) {
					var ws = $.grep(workflowSteps.Steps, function(item) {
						return item.nav === mainContainerRoute.nav[0] && item.app === mainContainerRoute.app;
					});
					if (ws && ws.length > 0) {
						var workflowStep = ws[0];

						//set the control to this record being selected.
						var processStepBar = this.getView().byId("processStepBar");
						if (processStepBar) {
							processStepBar.setSelected(workflowStep.number);
							foundRoute = true;
						}
					}
				}
			}
			if (!foundRoute) {
				//default the route to the first step of the workflow.
				var stepNumbers = workflowSteps.Steps.map(function(item) {
					return item.number;
				});
				var minStepNumber = Math.min.apply(Math, stepNumbers);
				var ws = $.grep(workflowSteps.Steps, function(item) {
					return item.number === minStepNumber;
				});
				if (ws && ws.length > 0) {
					var workflowStep = ws[0];
					Interop.navigateContainer(Interop.StandardContainer.Main, {
						app: workflowStep.app,
						nav: [workflowStep.nav, Interop.getCurrentRoute(this.ContainerName).nav[1]]
					});
				}
			}

		},
		bindView: function() {
			this.onDisplayProcessFlow();
		},
		setHeaderRecord: function(headerDetail) {

		},
		loadReferenceData: function() {

			var referenceData = {};
			var oReferenceModel = new JSONModel(referenceData);
			this.getView().setModel(oReferenceModel, "referenceData");
		},
		onDisplayProcessFlow: function() {
			var workflowSteps = this.getWorkflowSteps(this.WorkflowId);
			var wsModel = new JSONModel(workflowSteps);
			this.getView().setModel(wsModel, "wsModel");
		},
		onPress: function(e) {
			var source = e.getSource();
			if (source) {
				var bindingContext = source.getBindingContext("wsModel");
				var object = bindingContext.getObject();
				if (object) {
					Interop.navigateContainer(Interop.StandardContainer.Main, {
						app: object.app,
						nav: [object.nav, Interop.getCurrentRoute(this.ContainerName).nav[1]]
					});
				}
			}
		}

	});
});
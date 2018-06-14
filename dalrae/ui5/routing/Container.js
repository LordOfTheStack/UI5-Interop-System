sap.ui.define(
    ['sap/ui/core/Control',
    'dalrae/ui5/routing/Interop'],
    function(Control,Interop) {
        
        return Control.extend("dalrae.ui5.routing.Container",{
            metadata: {
            	properties: {
            		name: { type: "string" },
            		width: { type: "sap.ui.core.CSSSize", defaultValue: "100%" },
            		height: { type: "sap.ui.core.CSSSize", defaultValue: "100%" }
            	},
            	events: {
            		ready:	{}	
            	},
            	aggregations: {
            		content: {}
            	},
            	defaultAggregation: "content"
            },
            
            
            renderer: function(oRm,oControl) {
            	if(!oControl._registered) {
            		oControl._registered = true;
            		Interop.registerContainer(oControl.getName() || oControl.sId,oControl);
            		oControl.fireReady();
            	}
            	oRm.write("<div style=\"width:" + oControl.getWidth() + ";height:" + oControl.getHeight() + "\"");
        		oRm.writeClasses(oControl);
            	oRm.writeControlData(oControl);
            	oRm.write(">");
            	$(oControl.getContent()).each(function(){
            		oRm.renderControl(this);
            	});
            	oRm.write("</div>");
            }
            
        	
            
        });
    }
);
jQuery.sap.declare("dhs.quotes.util.Formatter");
jQuery.sap.require("dhs.ndis.util.Constants");

dhs.quotes.util.Formatter = {
    
    Status: {
        Open: "OPEN",
        Sent: "SNTP",
        Responded: "RESR"
    },
    
    CanSetPrice: function(status) {
        //return true;
        //return (status === dhs.quotes.util.Formatter.Status.Sent);
        return (status === dhs.quotes.util.Formatter.Status.Sent
            || status === dhs.quotes.util.Formatter.Status.Responded);
        //return (status === dhs.quotes.util.Formatter.Status.Open
        //        || status === dhs.quotes.util.Formatter.Status.Sent);
    },
    
    PartialEditOnly: function(status) {
        return (status === dhs.quotes.util.Formatter.Status.Responded);
    },

    
    CanApprove: function(status) {
        return (status === dhs.quotes.util.Formatter.Status.Responded);
    },
    
    CanReject: function(status) {
        return (status === dhs.quotes.util.Formatter.Status.Open
                 || status === dhs.quotes.util.Formatter.Status.Sent
                 || status === dhs.quotes.util.Formatter.Status.Responded);
    },
    
    OpportunityCreated: function(OppGuid) {
        return (OppGuid && OppGuid !== dhs.ndis.util.BlankGuid);
    },
	
	isNotLegacy: function(OppGuid, QuoteReceived) {
	    return !dhs.quotes.util.Formatter.isLegacy(OppGuid,QuoteReceived);
	},
	
	isLegacy: function(OppGuid, QuoteReceived) {
	    return ((!OppGuid || OppGuid === dhs.ndis.util.BlankGuid) && QuoteReceived);
	},
	
	LegacyStatus: function(StatusText, OppGuid, QuoteReceived) {
	    var legacy = dhs.quotes.util.Formatter.isLegacy(OppGuid,QuoteReceived);
	    return (legacy ? "Quote Already Received" : StatusText); 
	},
}
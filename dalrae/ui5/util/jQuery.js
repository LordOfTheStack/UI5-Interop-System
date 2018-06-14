//jquery extensions, these functions accessible via $. or $(object).
//-PhillS
jQuery.fn.extend({
    
    /**
     * Simplified shortcut function for inserting an item into an array at specified index
     * @param {int} index the index number, 0 based
     * @param {object} item the object to insert
     **/
    insert: function(index,item) {
        this.splice(index,0,item);
    },
    
    /**
        * use on an array, to find the first object that has the matching field and value
        * @param {string} field name of the field to test against
        * @param {*} value value to test against the field, === comparison will be done, and if true, the object is returned
        * @return {Object} the object within the source array that matches the field === value comparison. if multiple the first one found is returned, if none, undefined is returned
        * @author PhillS
    */
    findByField: function(field,value) {
        for(i=0; i<this.length; i++) {
            if(this[i][field] === value)
                return this[i];
        } 
        return undefined;
    },
    
    /**
       * use on an array, to retun a filtered array based on the matching field=value you specify
       * @param {string} field name of the field to test against
       * @param {*} value value to test against the field, === comparison will be done against this value, if true, that record is returned in the resulting array
       * @param {bool} [not] optional, true to flip the operator, so that the items matched WON'T be returned, and all others will
       * @return {Object[]} a copy of the source array, but containing only those objects which matched the field === value condition
       * @author PhillS
    */
    filterByField : function(field,value,not) {
        var filtered = [];
        for(i=0; i<this.length; i++) {
            if(not) {
                if(this[i][field] !== value)
                    filtered.push(this[i]);
            } else {
                if(this[i][field] === value)
                    filtered.push(this[i]);
            }
        } 
        return filtered;
    },
    
    /**
       * use on an array, to return a filtered array where only distinct entries of a particular field are returned
       * @param {string} field name of the field that must be unique
       * @return {Object[]} a copy of the source array, but containing only those objects which matched the distinct condition
       * @author PhillS
    */
    distinct : function(field) {
        var filtered = [];
        for(i=0; i<this.length; i++) {
            var v = this[i][field];
            var d = true;
            $(filtered).each(function(){
                if(this[field] === v)
                    d = false;
            });
            if(d)
                filtered.push(this[i]); 
        } 
        return filtered;
    },
    
    /**
        * @function flatten
        * @description use on an array, whose items also contain an array, to return a flatterned version (this is like an inner join basically)
        * @param {string} itemfield the string name of the property where the inner arrays can be found
        * @param {string} [itemfield2] optional, specify if the array is actually within another object, in odata expands itemfield should be "results"
        * @return {Object[]} a new array, which is a flattened (inner join) version of the source array and its subarrays
        * @author PhillS
        * @example
        * //returns [{name: 'store1', animal: 'kitten'},
        *            {name: 'store1', animal: 'dog'},
        *            {name: 'store2', animal: 'dragon'}];
        * var myarray = [{name: 'store1', sells: [
        *                               {animal: 'kitten'},
        *                               {animal: 'dog'}]},
        *                {name: 'store2', sells: [
        *                               {animal: 'dragon'}]}];
        * var flattened = $(myarray).flatten('sells');
    */
    flatten: function(itemfield,itemfield2) {
        var flat = [];
        for(i=0; i<this.length; i++) {
            var src = this[i][itemfield];
            if(itemfield2)
                src = src[itemfield2];
            for(j=0; j < src.length; j++) {
                var item = jQuery.extend(jQuery.extend({},this[i]),src[j]);
                flat.push(item);
            }
        }
        return flat;
    },
    
    /**
     * Shorthand version of $.extend
     * To completely copy a javascript object in memory
     * @param {bool} [shallow] Indicates that 'deep' should not be parsed to the extend method, meaning only the top level properties are copied, nothing nested
     * @author PhillS
     **/
    copy: function(shallow) {
        var obj = {};
        $.extend((shallow ? false : true),obj,this[0]); 
        return obj;
    },
    
});
const getAttributes = require('../../execution/utils/StatusUtil').getAttributes;
const getStatus = require('../../execution/utils/StatusUtil').getStatus;

const {
  is
} = require('bpmnlint-utils');



/**
 * A rule that checks that no attribute is redeclared.
 */
module.exports = function() {

  function check(node, reporter) {
    if ( node.$parent ) {
      const attributes = getAttributes(node);
      const parentStatus = getStatus(node.$parent);
      for (var i=0; i < attributes.length; i++) {
        if (parentStatus.filter(attribute => attribute.name == attributes[i].name).length > 0) {
          reporter.report(node.id, "Attribute '" + attributes[i].name + "' is redeclared");
        }
      }
    }
  }

  return {
    check
  };

};




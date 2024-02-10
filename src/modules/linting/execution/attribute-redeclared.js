const getAttributes = require('../../bpmnos/utils/StatusUtil').getAttributes;
const getStatus = require('../../bpmnos/utils/StatusUtil').getStatus;

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
        if (parentStatus.filter(attribute => attribute.id == attributes[i].id).length > 0) {
          reporter.report(node.id, "Attribute with id '" + attributes[i].id + "' is redeclared");
        }
        if (parentStatus.filter(attribute => attribute.name == attributes[i].name).length > 0) {
          reporter.report(node.id, "Attribute with name '" + attributes[i].name + "' is shadowed");
        }
      }
    }
  }

  return {
    check
  };

};




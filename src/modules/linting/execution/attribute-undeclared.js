const getCustomElements = require('./helper').getCustomElements;
const getStatus = require('./helper').getStatus;

const {
  is
} = require('bpmnlint-utils');



/**
 * A rule that checks that attributes for restrictions and operators are declared.
 */
module.exports = function() {

  function check(node, reporter) {
    const status = getStatus(node);
    const customElements = getCustomElements(node);
    for (var i=0; i < customElements.length; i++ ) {
      const restrictions = customElements[i].restriction;
      if ( restrictions ) {
        for (var j=0; j < restrictions.length; j++) {
          if ( !restrictions[j].attribute ) {
            reporter.report(node.id, "Attribute missing for restriction '" + restrictions[j].id + "'");
          }
          else if ( status.filter(attribute => attribute.name == restrictions[j].attribute).length == 0) {
            reporter.report(node.id, "Restriction on undeclared attribute '" + restrictions[j].attribute + "'");
          }
        }
      }
      const operators = customElements[i].operator;
      if ( operators ) {
        for (var j=0; j < operators.length; j++) {
          if ( !operators[j].attribute ) {
            reporter.report(node.id, "Attribute missing for operator '" + operators[j].id + "'");
          }
          else if ( status.filter(attribute => attribute.name == operators[j].attribute).length == 0) {
            reporter.report(node.id, "Operator on undeclared attribute '" + operators[j].attribute + "'");
          }
        }
      }
    }
  }

  return {
    check
  };

};




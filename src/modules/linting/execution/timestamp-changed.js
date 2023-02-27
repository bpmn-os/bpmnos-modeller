const getCustomElements = require('../../execution/utils/StatusUtil').getCustomElements;

const {
  isAny
} = require('bpmnlint-utils');



/**
 * A rule that checks that attributes for restrictions and operators are declared.
 */
module.exports = function() {

  function check(node, reporter) {
    if ( isAny(node,['bpmn:Process','bpmn:SubProcess']) ) {
      const customElements = getCustomElements(node);
      for (var i=0; i < customElements.length; i++ ) {
        const operators = customElements[i].operator;
        if ( operators && operators.length > 0) {
          for (var j=0; j < operators.length; j++ ) {
            if ( operators[j].attribute == "timestamp" ) {
              reporter.report(node.id, "Operator changes 'timestamp'");
            }
          } 
        }
      }

    }
  }

  return {
    check
  };

};



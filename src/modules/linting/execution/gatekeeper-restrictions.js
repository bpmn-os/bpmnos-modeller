const getProcess = require('../engine/helper').getProcess;
const getCustomElements = require('../../bpmnos/utils/StatusUtil').getCustomElements;
const getStatus = require('../../bpmnos/utils/StatusUtil').getStatus;

const {
  is
} = require('bpmnlint-utils');



/**
 * A rule that checks that attributes for restrictions and operators are declared.
 */
module.exports = function() {

  function check(node, reporter) {
    const process = getProcess(node) || {};
    if ( process.isExecutable
         && is(node,'bpmn:SequenceFlow') 
         && is(node.sourceRef,'bpmn:ExclusiveGateway')
         && node.sourceRef.outgoing.length > 1 
    ) {

      const customElements = getCustomElements(node);
      for (var i=0; i < customElements.length; i++ ) {
        const restrictions = customElements[i].restriction;
        if ( restrictions && restrictions.length > 0) {
          return;
        }
      }

      reporter.report(node.id, "Gatekeeper restrictions missing");
    }
  }

  return {
    check
  };

};



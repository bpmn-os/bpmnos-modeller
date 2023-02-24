const getProcess = require('../engine/helper').getProcess;
const getCustomElements = require('../../execution/utils/StatusUtil').getCustomElements;

const {
  is
} = require('bpmnlint-utils');


/**
 * A rule that verifies that request and release activities refer to at least one allocation.
 */
module.exports = function() {

  function check(node, reporter) {
    const process = getProcess(node) || {};
    if ( !process.isExecutable || !is(node, 'bpmn:SubProcess') || !( node.type == 'Request' || node.type == 'Release' ) ) {
      return;
    }
    const customElements = getCustomElements(node);
    for (var i=0; i < customElements.length; i++ ) {
      const allocations = customElements[i][node.type.toLowerCase()] || [];
      if ( allocations.length ) {
        return;
      }
    }
    reporter.report(node.id, node.type + 's are missing');
  }

  return {
    check
  };

};

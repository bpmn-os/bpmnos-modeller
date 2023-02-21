const {
  is,
  isAny
} = require('bpmnlint-utils');

module.exports = function () {
  function check(node, reporter) {
    if ( is(node,'bpmn:FlowNode') && !isAny(node, ['bpmn:StartEvent','bpmn:EndEvent']) ) {
      if (!node.outgoing && !node.triggeredByEvent ) {
        reporter.report(node.id, 'Element has no outgoing sequence flow');
      }
    }
  }
  return {
    check
  };
}



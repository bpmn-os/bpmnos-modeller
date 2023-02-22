const {
  is,
  isAny
} = require('bpmnlint-utils');

module.exports = function () {
  function check(node, reporter) {
    if ( is(node,'bpmn:FlowNode') && !isAny(node, ['bpmn:StartEvent','bpmn:BoundaryEvent']) ) {
      if (!node.incoming && !node.triggeredByEvent && !node.isForCompensation ) {
        reporter.report(node.id, 'Element has no incoming sequence flow');
      }
    }
  }
  return {
    check
  };
}



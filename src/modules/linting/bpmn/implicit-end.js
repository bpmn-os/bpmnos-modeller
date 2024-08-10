const {
  is,
  isAny
} = require('bpmnlint-utils');

module.exports = function () {
  function check(node, reporter) {
    if ( is(node,'bpmn:FlowNode')  && !is(node.$parent,'bpmn:AdHocSubProcess') && !isAny(node, ['bpmn:StartEvent','bpmn:EndEvent']) && !isCompensationBoundary(node)) {
      if (!(node.outgoing && node.outgoing.length) && ( is(node,'bpmn:BoundaryEvent') || !node.triggeredByEvent) && !node.isForCompensation ) {
        reporter.report(node.id, 'Implicit end');
      }
    }
  }
  return {
    check
  };
}

// helpers /////////////////

function isCompensationBoundary(node) {

  var eventDefinitions = node.eventDefinitions;

  if (!is(node, 'bpmn:BoundaryEvent')) {
    return false;
  }

  if (!eventDefinitions || eventDefinitions.length !== 1) {
    return false;
  }

  return is(eventDefinitions[0], 'bpmn:CompensateEventDefinition');
}



const {
  is
} = require('bpmnlint-utils');

module.exports = function () {
  function check(node, reporter) {
    // End events legitimately have no outflow; everything else (including start events
    // without an outgoing flow) is an implicit end.
    if ( is(node,'bpmn:FlowNode')  && !is(node.$parent,'bpmn:AdHocSubProcess') && !is(node, 'bpmn:EndEvent') && !isCompensationBoundary(node)) {
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



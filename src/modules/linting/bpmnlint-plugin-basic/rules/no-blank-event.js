const {
  is,
  isAny
} = require('bpmnlint-utils');


/**
 * A rule that verifies that an event contains one event definition.
 */
module.exports = function() {

  function check(node, reporter) {
    if ( ( isAny(node, ['bpmn:IntermediateThrowEvent','bpmn:IntermediateCatchEvent','bpmn:BoundaryEvent'])
                || ( is(node, 'bpmn:StartEvent') && node.$parent.triggeredByEvent ) 
              ) && (!node.eventDefinitions || !node.eventDefinitions.length) 
    ) {
      reporter.report(node.id, 'Event has no event definition');
    }
  }

  return {
    check
  };

};

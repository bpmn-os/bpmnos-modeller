const {
  is,
  isAny
} = require('bpmnlint-utils');

const requiresCheck = require('./helper').requiresCheck;

module.exports = function () {
  function check(node, reporter) {
    if ( requiresCheck(node) ) {
      if ( is(node, 'bpmn:StartEvent') && !node.$parent.triggeredByEvent && node.eventDefinitions && node.eventDefinitions.length ) {
        reporter.report(node.id, 'Event type not supported by execution engine');
      }
      else if ( is(node, 'bpmn:Event') 
                && node.eventDefinitions && node.eventDefinitions.length > 0 
                && !isAny(node.eventDefinitions[0], ['bpmn:MessageEventDefinition','bpmn:TimerEventDefinition','bpmn:EscalationEventDefinition','bpmn:ErrorEventDefinition', 'bpmn:CompensateEventDefinition'] )
      ) {
        reporter.report(node.id, 'Event type not supported by execution engine');
      }
    }
  }
  return {
    check
  };
}



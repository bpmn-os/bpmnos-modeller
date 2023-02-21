const {
  is,
  isAny
} = require('bpmnlint-utils');

const getProcess = require('./helper').getProcess;

module.exports = function () {
  function check(node, reporter) {
    let process = getProcess(node) || {};
    if ( process.isExecutable ) {
      if ( is(node, 'bpmn:StartEvent') && !node.$parent.triggeredByEvent && node.eventDefinitions && node.eventDefinitions.length ) {
        reporter.report(node.id, 'Event not supported for executable processes');
      }
      else if ( is(node, 'bpmn:Event') 
                && node.eventDefinitions && node.eventDefinitions.length > 0 
                && !isAny(node.eventDefinitions[0], ['bpmn:MessageEventDefinition','bpmn:TimerEventDefinition','bpmn:EscalationEventDefinition','bpmn:ErrorEventDefinition'] )
      ) {
        reporter.report(node.id, 'Event not supported for executable processes');
      }
    }
  }
  return {
    check
  };
}



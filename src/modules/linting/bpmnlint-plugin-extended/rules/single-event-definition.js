const getProcess = require('./helper').getProcess;

const {
  is,
} = require('bpmnlint-utils');


/**
 * A rule that verifies that an event contains one event definition.
 */
module.exports = function() {

  function check(node, reporter) {
    let process = getProcess(node) || {};
    if ( process.isExecutable && is(node, 'bpmn:Event') && node.eventDefinitions && node.eventDefinitions.length > 1) {
      reporter.report(node.id, 'Event has multiple event definitions', [ 'eventDefinitions' ]);
    }
  }

  return {
    check
  };

};

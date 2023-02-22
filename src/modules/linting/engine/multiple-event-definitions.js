const requiresCheck = require('./helper').requiresCheck;

const {
  is,
} = require('bpmnlint-utils');


/**
 * A rule that verifies that an event contains one event definition.
 */
module.exports = function() {

  function check(node, reporter) {
    let process = requiresCheck(node) || {};
    if ( process.isExecutable && is(node, 'bpmn:Event') && node.eventDefinitions && node.eventDefinitions.length > 1) {
      reporter.report(node.id, 'Multiple event definitions not supported by execution engine', [ 'eventDefinitions' ]);
    }
  }

  return {
    check
  };

};

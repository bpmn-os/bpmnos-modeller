const {
  is
} = require('bpmnlint-utils');


/**
 * Rule that reports processes for which isExecutable is not true.
 */
module.exports = function() {

  function check(node, reporter) {
    if ( is(node, 'bpmn:Process') && !node.isExecutable ) {
      reporter.report(node.id, 'Executable flag is not set');
    }
  }

  return {
    check: check
  };
};

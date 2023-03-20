const {
  is
} = require('bpmnlint-utils');

module.exports = function () {
  function check(flow, reporter) {
    if ( is(flow,'bpmn:SequenceFlow') && flow.sourceRef.id == flow.targetRef.id ) {
      reporter.report(flow.id, 'Loop');
    }
  }
  return {
    check
  };
}


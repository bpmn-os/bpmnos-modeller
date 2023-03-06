const {
  is
} = require('bpmnlint-utils');

module.exports = function () {
  function check(node, reporter) {
    if ( is(node,'bpmn:SequenceFlow') && node.conditionExpression ) {
      reporter.report(node.id, 'Implicit gateway');
    }
  }
  return {
    check
  };
}


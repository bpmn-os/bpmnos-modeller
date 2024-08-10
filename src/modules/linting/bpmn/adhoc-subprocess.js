const {
  is,
  isAny
} = require('bpmnlint-utils');

module.exports = function () {
  function check(node, reporter) {
    if ( is(node,'bpmn:StartEvent')  && is(node.$parent,'bpmn:AdHocSubProcess') ) {
      reporter.report(node.id, 'Illegal start event in ad-hoc subprocess');
    }
    if ( is(node,'bpmn:EndEvent')  && is(node.$parent,'bpmn:AdHocSubProcess') ) {
      reporter.report(node.id, 'Illegal end event in ad-hoc subprocess');
    }
  }
  return {
    check
  };
}

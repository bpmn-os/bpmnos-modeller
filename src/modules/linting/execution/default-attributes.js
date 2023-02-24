const getStatus = require('../../execution/utils/StatusUtil').getStatus;

const {
  is
} = require('bpmnlint-utils');

/**
 * A rule that checks that attributes for restrictions and operators are declared.
 */
module.exports = function() {

  function check(node, reporter) {
    if ( is(node,'bpmn:Process') && node.isExecutable ) {
      const status = getStatus(node);
      if ( !status.find(attribute => attribute.name == "instance") ) {
        reporter.report(node.id, "Attribute 'instance' is missing");
      }
      if ( !status.find(attribute => attribute.name == "timestamp") ) {
        reporter.report(node.id, "Attribute 'timestamp' is missing");
      }
    }
  }

  return {
    check
  };

};



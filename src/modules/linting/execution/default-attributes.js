const getStatus = require('../../execution/utils/StatusUtil').getStatus;
const getCustomElements = require('../../execution/utils/StatusUtil').getCustomElements;

const {
  is,
  isAny
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

    if ( isAny(node,['bpmn:Process','bpmn:SubProcess']) ) {
      const customElements = getCustomElements(node);
      for (var i=0; i < customElements.length; i++ ) {
        const operators = customElements[i].operator;
        if ( operators && operators.length > 0) {
          for (var j=0; j < operators.length; j++ ) {
            if ( operators[j].attribute == "timestamp" ) {
              reporter.report(node.id, "Operator changes 'timestamp' attribute");
            }
          } 
        }
      }
    }

    if ( isAny(node,['bpmn:Process','bpmn:SubProcess','bpmn:Activity']) ) {
      const customElements = getCustomElements(node);
      for (var i=0; i < customElements.length; i++ ) {
        const operators = customElements[i].operator;
        if ( operators && operators.length > 0) {
          for (var j=0; j < operators.length; j++ ) {
            if ( operators[j].attribute == "instance" ) {
              reporter.report(node.id, "Operator changes 'instance' attribute");
            }
          } 
        }
      }
    }

    if ( is(node,'bpmn:CatchEvent') ) {
      const customElements = getCustomElements(node);
      for (var i=0; i < customElements.length; i++ ) {
        if ( customElements[i].$type == "execution:Message" ) {
          const contents = customElements[i].content;
          if ( contents && contents.length > 0) {
            for (var j=0; j < contents.length; j++ ) {
              if ( contents[j].attribute == "instance" || contents[j].attribute == "timestamp" ) {
                reporter.report(node.id, "Message changes '" + contents[j].attribute + "' attribute");
              }
            } 
          }
        }
      }
    }
  }

  return {
    check
  };

};



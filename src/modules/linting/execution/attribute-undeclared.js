const getCustomElements = require('../../execution/utils/StatusUtil').getCustomElements;
const getStatus = require('../../execution/utils/StatusUtil').getStatus;

const {
  is
} = require('bpmnlint-utils');



/**
 * A rule that checks that attributes for restrictions and operators are declared.
 */
module.exports = function() {

  function check(node, reporter) {
    const status = getStatus(node);
    const customElements = getCustomElements(node);
    for (var i=0; i < customElements.length; i++ ) {
      const restrictions = customElements[i].restriction;
      if ( restrictions ) {
        for (var j=0; j < restrictions.length; j++) {
          if ( !restrictions[j].attribute ) {
            reporter.report(node.id, "Attribute missing for restriction '" + restrictions[j].id + "'");
          }
          else if ( status.filter(attribute => attribute.name == restrictions[j].attribute).length == 0) {
            reporter.report(node.id, "Restriction on undeclared attribute '" + restrictions[j].attribute + "'");
          }
        }
      }
      const operators = customElements[i].operator;
      if ( operators ) {
        for (var j=0; j < operators.length; j++) {
          if ( !operators[j].attribute ) {
            reporter.report(node.id, "Attribute missing for operator '" + operators[j].id + "'");
          }
          else if ( status.filter(attribute => attribute.name == operators[j].attribute).length == 0) {
            reporter.report(node.id, "Operator on undeclared attribute '" + operators[j].attribute + "'");
          }

          if ( !operators[j].parameter ) {
            operators[j].parameter.forEach(function(parameter) {
              if ( parameter.attribute && status.filter(attribute => attribute.name == parameter.attribute).length == 0) {
                reporter.report(node.id, "Operator has parameter using undeclared attribute '" + parameter.attribute + "'");
              }
            });
          }
        }
      }
      if ( is(node,'bpmn:Event') && customElements[i].$type == "execution:Parameter" ) {
        // Timer parameter
        const timerAttribute = customElements[i].attribute;
        if ( timerAttribute && status.filter(attribute => attribute.name == timerAttribute).length == 0) {
          reporter.report(node.id, "Parameter uses undeclared attribute '" + timerAttribute + "'");
        }
      }
      if ( is(node,'bpmn:Event') && customElements[i].$type == "execution:Message" ) {
        // Message parameter
        const parameters = customElements[i].parameter;
        if ( parameters ) {
          parameters.forEach(function(parameter) {
            if ( parameter.attribute && status.filter(attribute => attribute.name == parameter.attribute).length == 0) {
              reporter.report(node.id, "Parameter uses undeclared attribute '" + parameter.attribute + "'");
            }
          });
        }
        // Message content
        const contents = customElements[i].content;
        if ( contents ) {
          contents.forEach(function(content) {
            if ( content.attribute && status.filter(attribute => attribute.name == content.attribute).length == 0) {
              reporter.report(node.id, "Message content uses undeclared attribute '" + content.attribute + "'");
            }
          });
        }
      }

      if ( is(node, 'bpmn:SubProcess') && ( node.type == 'Request' || node.type == 'Release' ) ) {
        const allocations = customElements[i].request || customElements[i].release;
        if ( allocations ) {
          allocations.forEach(function(allocation) {
            if ( allocation.message ) {
              allocation.message.forEach(function(message) {
                if ( message.content ) {
                  message.content.forEach(function(content) {
                    if ( content.attribute && status.filter(attribute => attribute.name == content.attribute).length == 0) {
                      reporter.report(node.id, "Message content uses undeclared attribute '" + content.attribute + "'");
                    }
                  });
                }
              });
            }
          });
        }
      }
    }
  }

  return {
    check
  };

};




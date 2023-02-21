const {
  is,
  isAny
} = require('bpmnlint-utils');

function getProcess(node) {
  do {
    if ( is(node, 'bpmn:Process') ) {
      return node;
    }
    node = node.$parent;
  } while ( node );
  return;
}

/**
 * Create a checker that identifies unsupported elements.
 *
 * @param {String} type
 *
 * @return {Function} ruleImpl
 */
function unsupportedNode(description, types, property, value) {

  return function() {
    function check(node, reporter) {
      types = Array.isArray(types) ? types : [ types ];
      let process = getProcess(node) || {};
      if ( process.isExecutable && isAny(node, types ) ) {
        if (!property) {
          reporter.report(node.id, description + ' not supported for executable processes');
        }
        else if ( value == undefined && node[property] ) {
          reporter.report(node.id, description + ' not supported for executable processes');
        }
        else if ( value != undefined && node[property] === value ) {
          reporter.report(node.id, description + ' not supported for executable processes');
        }
      }
    }

    return {
      check
    };

  };
}

module.exports.getProcess = getProcess;
module.exports.unsupportedNode = unsupportedNode;

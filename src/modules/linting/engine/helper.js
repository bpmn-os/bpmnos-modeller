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

function requiresCheck(node) {
  const process = getProcess(node) || {};
  if (!process.isExecutable) {
    return false;
  }
  while ( node ) {
    node = node.$parent;
    if ( node && is(node, 'bpmn:SubProcess') ) {
      if (node.type == "Resource" || node.type == "Request" || node.type == "Release" ) {
        return false;
      }
      else if ( node.isExpanded == false ) {
        return true;
      }
    }
  }
  return true;
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
      if ( requiresCheck(node) && isAny(node, types ) ) {
        if (!property) {
          reporter.report(node.id, description);
        }
        else if ( value == undefined && node[property] ) {
          reporter.report(node.id, description);
        }
        else if ( value != undefined && node[property] === value ) {
          reporter.report(node.id, description);
        }
      }
    }

    return {
      check
    };

  };
}

module.exports.getProcess = getProcess;
module.exports.requiresCheck = requiresCheck;
module.exports.unsupportedNode = unsupportedNode;

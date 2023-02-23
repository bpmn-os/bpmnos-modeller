const {
  is
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

function getCustomElements(node) {
  if ( node && node.extensionElements && node.extensionElements ) {
    return node.extensionElements.values;
  }
  return [];
}

/**
 * A function that returns the full attributes declared for a node
 */
function getAttributes(node) {
  const customElements = getCustomElements(node);
  for (var i=0; i < customElements.length; i++ ) {
    if ( customElements[i].attribute ) {
      return customElements[i].attribute;
    }
  }
  return [];
}

/**
 * A function that returns the full status of a node (including inherited attributes)
 */
function getStatus(node) {
  let status = getAttributes(node);
  while ( node.$parent ) {
    node = node.$parent;
    status = status.concat(getAttributes(node));
  } 
  return status;
}


module.exports.getProcess = getProcess;
module.exports.getCustomElements = getCustomElements;
module.exports.getAttributes = getAttributes;
module.exports.getStatus = getStatus;

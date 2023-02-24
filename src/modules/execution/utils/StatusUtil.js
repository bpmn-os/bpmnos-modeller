function getBusinessObject(element) {
  do {
    if ( element.extensionElements ) {
      return element;
    }
    element = element.$parent;
  } while ( element );
  return;
}

function getCustomElements(businessObject) {
  if ( businessObject && businessObject.extensionElements && businessObject.extensionElements ) {
    return businessObject.extensionElements.values || [];
  }
  return [];
}

/**
 * A function that returns the full attributes declared for a businessObject
 */
function getAttributes(businessObject) {
  const customElements = getCustomElements(businessObject);
  for (var i=0; i < customElements.length; i++ ) {
    const attributes = customElements[i].attribute;
    if ( attributes && Array.isArray(attributes) ) {
      return  attributes;
    }
  }
  return [];
}

/**
 * A function that returns the full status of a businessObject (including inherited attributes)
 */
function getStatus(businessObject) {
  let status = getAttributes(businessObject);
  while ( businessObject.$parent ) {
    businessObject = businessObject.$parent;
    status = status.concat(getAttributes(businessObject));
  } 
  return status;
}

module.exports.getBusinessObject = getBusinessObject;
module.exports.getCustomElements = getCustomElements;
module.exports.getAttributes = getAttributes;
module.exports.getStatus = getStatus;

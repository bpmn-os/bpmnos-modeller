'use strict';

var is = require('bpmn-js/lib/util/ModelUtil').is,
    getBO = require('bpmn-js/lib/util/ModelUtil').getBusinessObject,
    getBusinessObject =  function getBusinessObject(element) { return is(element, 'bpmn:Participant') ? getBO(element).processRef : getBO(element); };
//var getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;
var    getExtensionElements = require('bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper').getExtensionElements;

var Helper = {};

module.exports = Helper;

/**
 * Return container element with given type from business object or undefined if none exist
 */

Helper.getContainerElement = function(element, type) {
  var bo = getBusinessObject(element);
  var containerElements = getExtensionElements(bo, type);
  if (typeof containerElements !== 'undefined') {
    return containerElements[0];
  }
};

/**
 * Return list of objects within container element with given type
 */
Helper.getObjectList = function(element, type, property) {
  var containerElement = this.getContainerElement(element,type);
  if (typeof containerElement === 'undefined') {
    return [];
  }
  // Determine the unique element name 
  var propertyName = property || Object.getPrototypeOf(containerElement).$descriptor.properties[0].name;
  return containerElement[propertyName] || [];
};


/**
 * Get an object from the business object at given index
 */
Helper.getObject = function(element, idx, type, property) {
  var objects = this.getObjectList(element, type, property);
  return objects[idx];
};


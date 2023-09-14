import { getBusinessObject, is } from 'bpmn-js/lib/util/ModelUtil';

import { getExtensionElementsList } from './ExtensionElementsUtil';

import {
  createElement,
} from '../utils/ElementUtil';

export function getCustomItems(element, type = undefined) {
  var businessObject = getRelevantBusinessObject(element);
  return getExtensionElementsList(businessObject, type) || [];
}

export function getCustomItem(element, type = undefined, index = 0) {
  var businessObject = getRelevantBusinessObject(element);
  var customItems = getExtensionElementsList(businessObject, type);
  if (typeof customItems !== 'undefined' && customItems.length > 0) {
    return customItems[index];
  }
}

export function ensureCustomItem(bpmnFactory, commandStack, element, type = undefined) {
  let item = getCustomItem(element,type);

  if ( !item ) {
    item = createCustomItem(bpmnFactory, commandStack, element, type);
  }
  return item;
}

export function createCustomItem(bpmnFactory, commandStack, element, type = undefined) {
  let commands = [];
  const businessObject = getRelevantBusinessObject(element);
  let extensionElements = businessObject.get('extensionElements');

  // (1) ensure 'bpmn:ExtensionElements'
  if (!extensionElements) {
    extensionElements = createElement(
      'bpmn:ExtensionElements',
      { values: [] },
      businessObject,
      bpmnFactory
    );

    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: businessObject,
        properties: { extensionElements }
      }
    });
  }

  // (2) create item of type
  let item = createElement(type, {}, extensionElements, bpmnFactory);

  commands.push({
    cmd: 'element.updateModdleProperties',
    context: {
      element,
      moddleElement: extensionElements,
      properties: {
        values: [ ...extensionElements.values, item ]
      }
    }
  });

  commandStack.execute('properties-panel.multi-command-executor', commands);

  return item;
}

export function getRelevantBusinessObject(element) {
  let businessObject = getBusinessObject(element);

  if (is(element, 'bpmn:Participant')) {
    return businessObject.get('processRef');
  }

  return businessObject;
}


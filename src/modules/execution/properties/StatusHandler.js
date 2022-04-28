import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import AttributeEntries from './AttributeEntries';

import {
  createElement,
  nextId
} from '../utils/ElementUtil';

import {
  getRelevantBusinessObject,
  getCustomItem,
  ensureCustomItem
} from '../utils/CustomItemUtil';

import { without } from 'min-dash';


// Creates status entry and returns { items, add }
export function statusHandler({ element, injector }) {
  let businessObject = getRelevantBusinessObject(element);

  // do not offer for empty pools
  if (!businessObject) {
    return;
  }

  if ( !is(businessObject, 'bpmn:Process') && !is(businessObject, 'bpmn:Activity') ) {
    return;
  }
  if ( is(element, 'bpmn:Activity') && ( getRelevantBusinessObject(element).type == "Request" || getRelevantBusinessObject(element).type == "Release") ) {
    return;
  }

  const bpmnFactory = injector.get('bpmnFactory'),
        commandStack = injector.get('commandStack');

  const status = getCustomItem( element, 'execution:Status' ) || {};

  const items = ( status.attribute || []).map((attribute, index) => {
    const id = element.id + '-attribute-' + index;

    return {
      id,
      label: attribute.get('name') || attribute.get('id'),
      entries: AttributeEntries({
        idPrefix: id,
        element,
        attribute
      }),
      autoFocusEntry: id + '-name',
      remove: removeFactory({ commandStack, element, attribute })
    };
  });

  return {
    items,
    add: addFactory({ bpmnFactory, commandStack, element })
  };
}

// ADD FACTORY //
function addFactory({ bpmnFactory, commandStack, element }) {
  return function(event) {
    event.stopPropagation();

    const status = ensureCustomItem(bpmnFactory, commandStack, element, 'execution:Status'); 

    // create 'execution:Attribute'
    const attribute = createElement('execution:Attribute', { id: nextId('Attribute_') , type: 'xs:decimal' }, status, bpmnFactory);

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: status,
      properties: {
        attribute: [ ...status.get('attribute'), attribute ]
      }
    });

  };
}

// REMOVE FACTORY //
function removeFactory({ commandStack, element, attribute }) {
  return function(event) {
    event.stopPropagation();

    const commands = [];

    const businessObject = getRelevantBusinessObject(element);

    let status = getCustomItem(element,'execution:Status');

    if (!status) {
      return;
    }

    const attributeList = without(status.get('attribute'), attribute);

    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: status,
        properties: {
          attribute: attributeList
        }
      }
    });

    // remove 'execution:Status' if there are no attributes anymore
    if (!attributeList.length) {
      const businessObject = getRelevantBusinessObject(element),
            extensionElements = businessObject.get('extensionElements');

      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: extensionElements,
          properties: {
            values: without(extensionElements.values, status)
          }
        }
      });
    }

    commandStack.execute('properties-panel.multi-command-executor', commands);
  };
}


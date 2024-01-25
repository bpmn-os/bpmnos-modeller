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


// Creates attributes entry and returns { items, add }
export function attributeHandler({ element, injector }) {
  let businessObject = getRelevantBusinessObject(element);

  // do not offer for empty pools
  if (!businessObject) {
    return;
  }

  if ( !is(businessObject, 'bpmn:Process') && !is(businessObject, 'bpmn:Activity') ) {
    return;
  }
  if ( is(businessObject, 'bpmn:Activity') && ( businessObject.type == "Request" || businessObject.type == "Release") ) {
    return;
  }

  const bpmnFactory = injector.get('bpmnFactory'),
        commandStack = injector.get('commandStack');

  const parent = getCustomItem( element, 'execution:Status' ) || {};
  const attributes = parent.attributes ? parent.get('attributes')[0] : {};

  const items = ( attributes.attribute || []).map((attribute, index) => {
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

    const parent = ensureCustomItem(bpmnFactory, commandStack, element, 'execution:Status'); 

    let attributes = parent.attributes ? parent.get('attributes')[0] : undefined;
    if ( !attributes ) {
      // create 'execution:Attributes'
      attributes = createElement('execution:Attributes', {}, parent, bpmnFactory);
      commandStack.execute('element.updateModdleProperties', {
          element,
          moddleElement: parent,
          properties: {
            attributes: [ ...parent.get('attributes'), attributes ]
          }
      });
    }

    // create 'execution:Attribute'
    const attribute = createElement('execution:Attribute', { id: nextId('Attribute_') , type: 'xs:decimal' }, attributes, bpmnFactory);

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: attributes,
      properties: {
        attribute: [ ...attributes.get('attribute'), attribute ]
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

    const parent = getCustomItem( element, 'execution:Status' ) || {};
    let attributes = parent.attributes ? parent.get('attributes')[0] : {};

    if (!attributes) {
      return;
    }

    const attributeList = without(attributes.get('attribute'), attribute);

    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: attributes,
        properties: {
          attribute: attributeList
        }
      }
    });

    // remove 'execution:Attributes' if there are no attributes anymore
    if (!attributeList.length) {
      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: parent,
          properties: {
            attributes: undefined
          }
        }
      });
    }

    commandStack.execute('properties-panel.multi-command-executor', commands);
  };
}


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

  if ( !is(businessObject, 'bpmn:Process') && !is(businessObject, 'bpmn:Activity') && !is(businessObject, 'bpmn:DataObjectReference') ) {
    return;
  }
  if ( is(businessObject, 'bpmn:Activity') && ( businessObject.type == "Request" || businessObject.type == "Release") ) {
    return;
  }

  let dataElement = undefined;
  if ( is(businessObject, 'bpmn:DataObjectReference') ) {
    dataElement = element;
    element = element.businessObject.dataObjectRef;
  }

  const bpmnFactory = injector.get('bpmnFactory'),
        commandStack = injector.get('commandStack');

  let attributes  = undefined;
  if ( dataElement ) {
    attributes = getCustomItem( element, 'bpmnos:Attributes' ) || {};
  }
  else {
    const parent = getCustomItem( element, 'bpmnos:Status' ) || {};
    attributes = parent.attributes ? parent.get('attributes')[0] : {};
  }
  
  const items = ( attributes.attribute || []).map((attribute, index) => {
    const id = element.id + '-attribute-' + index;

    return {
      id,
      label: attribute.get('name') ? attribute.get('name') + " : " + attribute.get('type'): attribute.get('id'),
      entries: AttributeEntries({
        idPrefix: id,
        element,
        attribute
      }),
      autoFocusEntry: id + '-name',
      remove: removeFactory({ commandStack, element, attribute, dataElement })
    };
  });
  return {
    items,
    add: addFactory({ bpmnFactory, commandStack, element, dataElement })
  };
}

// ADD FACTORY //
function addFactory({ bpmnFactory, commandStack, element, dataElement }) {
  return function(event) {
    event.stopPropagation();

    let attributes  = undefined;
    if ( dataElement ) {
      attributes = ensureCustomItem(bpmnFactory, commandStack, element, 'bpmnos:Attributes'); 
    }
    else {
      const parent = ensureCustomItem(bpmnFactory, commandStack, element, 'bpmnos:Status'); 
      attributes = parent.attributes ? parent.get('attributes')[0] : undefined;
      if ( !attributes ) {
        // create 'bpmnos:Attributes'
        attributes = createElement('bpmnos:Attributes', {}, parent, bpmnFactory);
        commandStack.execute('element.updateModdleProperties', {
          element,
          moddleElement: parent,
            properties: {
              attributes: [ ...parent.get('attributes'), attributes ]
            }
        });
      }
    }

    // create 'bpmnos:Attribute'
    const attribute = createElement('bpmnos:Attribute', { id: nextId('Attribute_') , type: 'decimal' }, attributes, bpmnFactory);

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: attributes,
      properties: {
        attribute: [ ...attributes.get('attribute'), attribute ]
      }
    });

    if ( dataElement ) {
      // trigger update via fake change
      commandStack.execute('element.updateModdleProperties', {
        element: dataElement,
        moddleElement: dataElement.businessObject.id
      });
    }
  };
}

// REMOVE FACTORY //
function removeFactory({ commandStack, element, attribute, dataElement }) {
  return function(event) {
    event.stopPropagation();

    const commands = [];

    const businessObject = getRelevantBusinessObject(element);

    let parent = undefined;
    let attributes  = undefined;
    if ( dataElement ) {
      attributes = getCustomItem( element, 'bpmnos:Attributes' ) || {};
    }
    else {
      parent = getCustomItem( element, 'bpmnos:Status' ) || {};
      attributes = parent.attributes ? parent.get('attributes')[0] : {};
    }

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

    if ( !dataElement && !attributeList.length) {
      // remove 'bpmnos:Attributes' from 'bpmnos:Status' if there are no attributes anymore
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

    if ( dataElement ) {
      // trigger update via fake change
      commandStack.execute('element.updateModdleProperties', {
        element: dataElement,
        moddleElement: dataElement.businessObject.id
      });
    }

    commandStack.execute('properties-panel.multi-command-executor', commands);
  };
}


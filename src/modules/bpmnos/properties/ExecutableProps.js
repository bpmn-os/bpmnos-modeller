import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import { CheckboxEntry, isCheckboxEntryEdited } from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';

import {
  createElement,
  nextId
} from '../utils/ElementUtil';

import {
  getCustomItem,
  ensureCustomItem
} from '../utils/CustomItemUtil';

/**
 * @typedef { import('@bpmn-io/properties-panel').EntryDefinition } Entry
 */

/**
 * @returns {Array<Entry>} entries
 */
export function ExecutableProps(props) {
  const {
    element
  } = props;

  if (!is(element, 'bpmn:Process') && !hasProcessRef(element)) {
    return [];
  }

  return [
    {
      id: 'isExecutable',
      component: Executable,
      isEdited: isCheckboxEntryEdited
    }
  ];
}

function Executable(props) {
  const {
    element
  } = props;

  const modeling = useService('modeling');
  const bpmnFactory = useService('bpmnFactory');
  const commandStack = useService('commandStack');
  const translate = useService('translate');

  let getValue, setValue;

  setValue = (value) => {
    if ( value ) {
      ensureDefaultAttributes(element,bpmnFactory,commandStack);
    }
    modeling.updateProperties(element, {
      isExecutable: value
    });
  };

  getValue = (element) => {
    return element.businessObject.isExecutable;
  };

  // handle properties on processRef level for participants
  if (is(element, 'bpmn:Participant')) {

    const process = element.businessObject.get('processRef');

    setValue = (value) => {
      if ( value ) {
        ensureDefaultAttributes(element,bpmnFactory,commandStack);
      }
      commandStack.execute(
        'element.updateModdleProperties',
        {
          element,
          moddleElement: process,
          properties: {
            isExecutable: value
          }
        }
      );
    };

    getValue = () => {
      return process.get('isExecutable');
    };

  }

  return CheckboxEntry({
    element,
    id: 'isExecutable',
    label: translate('Executable'),
    getValue,
    setValue
  });
}


// helper /////////////////////

function hasProcessRef(element) {
  return is(element, 'bpmn:Participant') && element.businessObject.get('processRef');
}

function hasInstanceAttribute(element) {
  let dataObjects = element.businessObject.flowElements.filter((element) => {
    return element.$type === 'bpmn:DataObject' && element.extensionElements && element.extensionElements.values.length;
  });
  for ( let dataObject of dataObjects ) {
    for ( let attribute of dataObject.extensionElements.values[0].get('attribute') ) {
      if ( attribute.id == "Instance" ) {
        return true;
      }
    }
  }
  return false;
}

function ensureDefaultAttributes(element,bpmnFactory,commandStack) {
  if ( !hasInstanceAttribute(element) ) {
    var dataObject = bpmnFactory.create('bpmn:DataObject');
    const attributes = ensureCustomItem(bpmnFactory, commandStack, dataObject, 'bpmnos:Attributes');
    const attribute = createElement('bpmnos:Attribute', { id: 'Instance' , name: 'instance', type: 'string' }, attributes, bpmnFactory);
    attributes.get('attribute').push(attribute);
    element.businessObject.flowElements.push(dataObject);
  }

  const status = ensureCustomItem(bpmnFactory, commandStack, element, 'bpmnos:Status'); 
  let attributes = status.get('attributes') ? status.attributes[0] : undefined;
  if ( !attributes ) {
    // create 'bpmnos:Attributes'
    attributes = createElement('bpmnos:Attributes', {}, parent, bpmnFactory);
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: status,
      properties: {
        attributes: [ attributes ]
      }
    });
  }

  let attributeList = attributes.get('attribute') || [];
/*
  if ( !attributeList.find(attribute => attribute.name == "instance") ) {
      const attribute = createElement('bpmnos:Attribute', { id: 'Instance' , name: 'instance', type: 'string' }, attributes, bpmnFactory);
      commandStack.execute('element.updateModdleProperties', {
        element,
        moddleElement: attributes,
        properties: {
          attribute: [ ...attributes.get('attribute'), attribute ]
        }
      });
  }
*/
  if ( !attributeList.find(attribute => attribute.name == "timestamp") ) {
    const attribute = createElement('bpmnos:Attribute', { id: 'Timestamp' , name: 'timestamp', type: 'decimal', value: '0' }, attributes, bpmnFactory);
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: attributes,
      properties: {
        attribute: [ ...attributes.get('attribute'), attribute ]
      }
    });
  }
}

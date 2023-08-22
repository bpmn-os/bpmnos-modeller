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

function ensureDefaultAttributes(element,bpmnFactory,commandStack) {
  const status = ensureCustomItem(bpmnFactory, commandStack, element, 'execution:Status'); 
  let attributes = status.get('attributes') ? status.attributes[0] : undefined;
  if ( !attributes ) {
    // create 'execution:Attributes'
    attributes = createElement('execution:Attributes', {}, parent, bpmnFactory);
    commandStack.execute('element.updateModdleProperties', {
        element,
        moddleElement: status,
        properties: {
        attributes: [ attributes ]
      }
    });
  }

  let attributeList = attributes.get('attribute') || [];
  if ( !attributeList.find(attribute => attribute.name == "instance") ) {
      const attribute = createElement('execution:Attribute', { id: 'Instance' , name: 'instance', type: 'xs:string' }, attributes, bpmnFactory);
      commandStack.execute('element.updateModdleProperties', {
        element,
        moddleElement: attributes,
        properties: {
          attribute: [ ...attributes.get('attribute'), attribute ]
        }
      });
  }
  if ( !attributeList.find(attribute => attribute.name == "timestamp") ) {
      const attribute = createElement('execution:Attribute', { id: 'Timestamp' , name: 'timestamp', type: 'xs:decimal', value: '0' }, attributes, bpmnFactory);
      commandStack.execute('element.updateModdleProperties', {
        element,
        moddleElement: attributes,
        properties: {
          attribute: [ ...attributes.get('attribute'), attribute ]
        }
      });
  }
}

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
/*
  let status = getCustomItem(element, 'execution:Status'); 
  if (!status) {
    status = ensureCustomItem(bpmnFactory, commandStack, element, 'execution:Status'); 
  }
*/
  const status = ensureCustomItem(bpmnFactory, commandStack, element, 'execution:Status'); 

  let attributes = status.get('attribute') || [];
  if ( !attributes.find(attribute => attribute.name == "instance") ) {
      const attribute = createElement('execution:Attribute', { id: nextId('Attribute_') , name: 'instance', type: 'xs:string' }, status, bpmnFactory);
      commandStack.execute('element.updateModdleProperties', {
        element,
        moddleElement: status,
        properties: {
          attribute: [ ...status.get('attribute'), attribute ]
        }
      });
  }
  if ( !attributes.find(attribute => attribute.name == "timestamp") ) {
      const attribute = createElement('execution:Attribute', { id: nextId('Attribute_') , name: 'timestamp', type: 'xs:integer' }, status, bpmnFactory);
      commandStack.execute('element.updateModdleProperties', {
        element,
        moddleElement: status,
        properties: {
          attribute: [ ...status.get('attribute'), attribute ]
        }
      });
  }
}

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

import { without } from 'min-dash';

/**
 * @typedef { import('@bpmn-io/properties-panel').EntryDefinition } Entry
 */

/**
 * @returns {Array<Entry>} entries
 */
export function SequentialPerformerProps(props) {
  const {
    element
  } = props;

  if (!is(element, 'bpmn:Activity') && !is(element, 'bpmn:Process') && !hasProcessRef(element)) {
    return [];
  }

  if (is(element, 'bpmn:SubProcess') && element.businessObject.triggeredByEvent ) {
    return [];
  }

  return [
    {
      id: 'isSequentialPerformer',
      component: SequentialPerformer,
      isEdited: isCheckboxEntryEdited
    }
  ];
}

function SequentialPerformer(props) {
  const {
    element
  } = props;

  const modeling = useService('modeling');
  const elementRegistry = useService('elementRegistry');
  const bpmnFactory = useService('bpmnFactory');
  const commandStack = useService('commandStack');
  const translate = useService('translate');

  let getValue, setValue;

  setValue = (value) => {
    if ( value ) {
      const performer = createElement('bpmn:Performer', { name: 'Sequential' }, element, bpmnFactory);
      modeling.updateProperties(element, { resources: [ ...(element.businessObject.resources || []), performer] });
    }
    else {
      const performer = element.businessObject.resources.find( function(el) { return ( is(el,'bpmn:Performer') && el.name == 'Sequential' )} );
      modeling.updateProperties(element, { resources: without(element.businessObject.resources, performer) });
    }
  };

  getValue = (element) => {
    for (let resourceRole of element.businessObject.resources || [] ) {
      if ( is(resourceRole,'bpmn:Performer') && resourceRole.name == 'Sequential' ) {
        return true;
      }
    }
    return false;
  };

  // handle properties on processRef level for participants
  if (is(element, 'bpmn:Participant')) {

    const process = element.businessObject.get('processRef');
    setValue = (value) => {
      if ( value ) {
        const performer = createElement('bpmn:Performer', { name: 'Sequential' }, process, bpmnFactory);
        commandStack.execute(
          'element.updateModdleProperties',
          {
            element,
            moddleElement: process,
            properties: {
              resources: [ ...(process.resources || []), performer]
            },
          }
        );
      }
      else {
        const performer = process.resources.find( function(el) { return ( is(el,'bpmn:Performer') && el.name == 'Sequential' )} );
        commandStack.execute(
          'element.updateModdleProperties',
          {
            element,
            moddleElement: process,
            properties: {
              resources: without(process.resources, performer)
            },
          }
        );
      }
    };    

    getValue = () => {
      for (let resourceRole of process.resources || [] ) {
        if ( is(resourceRole,'bpmn:Performer') && resourceRole.name == 'Sequential' ) {
          return true;
        }
      }
      return false;
    };

  }

  return CheckboxEntry({
    element,
    id: 'isSequentialPerformer',
    label: translate('Sequential performer'),
    getValue,
    setValue
  });
}


// helper /////////////////////

function hasProcessRef(element) {
  return is(element, 'bpmn:Participant') && element.businessObject.get('processRef');
}

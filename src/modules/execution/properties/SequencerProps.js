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
 * @returns {Array<Entry>} entries
 */
export function SequencerProps(props) {
  const {
    element
  } = props;

  if ( !is(element, 'bpmn:SubProcess' ) || 
    (element.businessObject && element.businessObject.type && element.businessObject.type != 'Sequencer')
  ) {
    return [];
  }

  return [
    {
      id: 'isSequencer',
      component: Sequencer,
      isEdited: isCheckboxEntryEdited
    }
  ];
}

function Sequencer(props) {
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
    modeling.updateProperties(element, {
      type: value ? 'Sequencer' : undefined
    });
    for ( let child of element.businessObject.flowElements || [] ) {
      if ( is(child, 'bpmn:Activity') ) {
        var shape = elementRegistry.get(child.id);
        modeling.updateProperties(shape, {} );
      }
    }
  };

  getValue = (element) => {
    return element.businessObject.type == 'Sequencer';
  };

  return CheckboxEntry({
    element,
    id: 'isSequencer',
    label: translate('Sequencer'),
    getValue,
    setValue
  });

}


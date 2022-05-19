import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import { CheckboxEntry, isCheckboxEntryEdited } from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';


/**
 * @returns {Array<Entry>} entries
 */
export function ConsumableProperty(props) {
  const {
    element
  } = props;

  if (!is(element, 'bpmn:Activity') || element.businessObject.type != 'Resource') {
    return [];
  }

  return [
    {
      id: 'consumable',
      component: ResourceConsumable,
      isEdited: isCheckboxEntryEdited
    }
  ];
}

function ResourceConsumable(props) {
  const {
    element
  } = props;

  const modeling = useService('modeling');
  const commandStack = useService('commandStack');
  const translate = useService('translate');

  let getValue, setValue;

  setValue = (value) => {
    modeling.updateProperties(element, {
      consumable: value
    });
  };

  getValue = (element) => {
    if ( element && element.businessObject ) {
	    return element.businessObject.get('consumable');
    }
  };

  return CheckboxEntry({
    element,
    id: 'consumable',
    label: translate('Consumable'),
    getValue,
    setValue
  });
}




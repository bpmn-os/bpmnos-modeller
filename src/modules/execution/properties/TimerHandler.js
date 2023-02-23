import {
  getBusinessObject,
  is
} from 'bpmn-js/lib/util/ModelUtil';

import { TextFieldEntry } from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';

import {
  getCustomItem,
  ensureCustomItem
} from '../utils/CustomItemUtil';

import {
  isTimerSupported
} from '../utils/EventDefinitionUtil';

/**
 * @returns {Array<Entry>} entries
 */
export function timerHandler({ element }) {

  if ( !isTimerSupported(element) ) {
    return [];
  }

  return [
    {
      id: element.id + '-name',
      component: TimerParameterName
    },    {
      id: element.id + '-attribute',
      component: TimerParameterAttribute
    }, {
      id: element.id + '-value',
      component: TimerParameterValue
    }
  ];
}

function TimerParameterName(props) {
  const {
    element
  } = props;

  const modeling = useService('modeling');
  const debounce = useService('debounceInput');
  const translate = useService('translate');
  const commandStack = useService('commandStack');
  const bpmnFactory = useService('bpmnFactory');

  const setValue = (value) => {
    // ensure 'extensionElements'
    let parameter = ensureCustomItem(bpmnFactory, commandStack, element, 'execution:Parameter'); 

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: parameter,
      properties: {
        name: value
      }
    });
  };

  const getValue = (element) => {
    const parameter = getCustomItem( element, 'execution:Parameter' );
    if ( parameter ) {
      return parameter.get('name');
    }
  };

  const validate = (value) => {
    if ( !value || value.trim() == "" ) {
      return 'Parameter name must not be empty.';
    }
  }

  return TextFieldEntry({
    element,
    id: 'name',
    label: translate('Parameter name'),
    validate,
    getValue,
    setValue,
    debounce
  });
}

function TimerParameterAttribute(props) {
  const {
    element
  } = props;

  const modeling = useService('modeling');
  const debounce = useService('debounceInput');
  const translate = useService('translate');
  const commandStack = useService('commandStack');
  const bpmnFactory = useService('bpmnFactory');

  const setValue = (value) => {
    let parameter = ensureCustomItem(bpmnFactory, commandStack, element, 'execution:Parameter' ); 

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: parameter,
      properties: {
        attribute: value
      }
    });
  };

  const getValue = (element) => {
    const parameter = getCustomItem( element, 'execution:Parameter' );
    if ( parameter ) {
      return parameter.get('attribute');
    }
  };

  return TextFieldEntry({
    element,
    id: 'attribute',
    label: translate('Attribute name'),
    getValue,
    setValue,
    debounce
  });
}
function TimerParameterValue(props) {
  const {
    element
  } = props;

  const modeling = useService('modeling');
  const debounce = useService('debounceInput');
  const translate = useService('translate');
  const commandStack = useService('commandStack');
  const bpmnFactory = useService('bpmnFactory');

  const setValue = (value) => {
    let parameter = ensureCustomItem(bpmnFactory, commandStack, element, 'execution:Parameter' ); 

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: parameter,
      properties: {
        value: value
      }
    });
  };

  const getValue = (element) => {
    const parameter = getCustomItem( element, 'execution:Parameter' );
    if ( parameter ) {
      return parameter.get('value');
    }
  };

  return TextFieldEntry({
    element,
    id: 'value',
    label: translate('Value'),
    getValue,
    setValue,
    debounce
  });
}

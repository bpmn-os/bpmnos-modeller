import {
  getBusinessObject,
  is
} from 'bpmn-js/lib/util/ModelUtil';

import { TextFieldEntry } from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';

import { getStatus } from '../utils/StatusUtil';

import {
  createElement,
  nextId
} from '../utils/ElementUtil';

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
    const timer = ensureCustomItem(bpmnFactory, commandStack, element, 'bpmnos:Timer'); 

    let parameter = timer.parameter ? timer.get('parameter')[0] : undefined;
    if ( !parameter ) {
      // create 'bpmnos:Parameter'
      parameter = createElement('bpmnos:Parameter', { name: 'trigger' }, timer, bpmnFactory);
      commandStack.execute('element.updateModdleProperties', {
          element,
          moddleElement: timer,
          properties: {
            parameter: [ parameter ]
          }
      });
    }

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: parameter,
      properties: {
        name: 'trigger'
      }
    });
  };

  const getValue = (element) => {
    return 'trigger';
/*
    const parameter = getCustomItem( element, 'bpmnos:Parameter' );
    if ( parameter ) {
      return parameter.get('name');
    }
*/
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
    debounce,
    disabled: function() { return true; }
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
    const timer = ensureCustomItem(bpmnFactory, commandStack, element, 'bpmnos:Timer'); 

    let parameter = timer.parameter ? timer.get('parameter')[0] : undefined;
    if ( !parameter ) {
      // create 'bpmnos:Parameter'
      parameter = createElement('bpmnos:Parameter', { name: 'trigger' }, timer, bpmnFactory);
      commandStack.execute('element.updateModdleProperties', {
          element,
          moddleElement: timer,
          properties: {
            parameter: [ parameter ]
          }
      });
    }

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: parameter,
      properties: {
        name: 'trigger',
        attribute: value
      }
    });
  };

  const getValue = (element) => {
    const timer = getCustomItem( element, 'bpmnos:Timer' ) || {};
    const parameter = timer.parameter ? timer.get('parameter')[0] : undefined;

    if ( parameter ) {
      return parameter.get('attribute');
    }
  };

  const validate = (value) => {
    if ( value ) {
      let businessObject = getBusinessObject(element);
      const status = getStatus(businessObject);    
      if (status.filter(attribute => attribute.name == value).length == 0) {
        return 'Attribute name does not exist.';
      }
    }
  }

  return TextFieldEntry({
    element,
    id: 'attribute',
    label: translate('Attribute name'),
//    validate,
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
    const timer = ensureCustomItem(bpmnFactory, commandStack, element, 'bpmnos:Timer'); 

    let parameter = timer.parameter ? timer.get('parameter')[0] : undefined;
    if ( !parameter ) {
      // create 'bpmnos:Parameter'
      parameter = createElement('bpmnos:Parameter', { name: 'trigger' }, timer, bpmnFactory);
      commandStack.execute('element.updateModdleProperties', {
          element,
          moddleElement: timer,
          properties: {
            parameter: [ parameter ]
          }
      });
    }

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: parameter,
      properties: {
        name: 'trigger',
        value: value
      }
    });
  };

  const getValue = (element) => {
    const timer = getCustomItem( element, 'bpmnos:Timer' ) || {};
    const parameter = timer.parameter ? timer.get('parameter')[0] : undefined;

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

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import { TextFieldEntry, SelectEntry, ListEntry } from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';

import { Parameter, ParameterEntries } from './ParameterEntries';

import {
  createElement
} from '../utils/ElementUtil';

import { without } from 'min-dash';

export default function AttributeEntries(props) {

  const {
    idPrefix,
    element,
    attribute
  } = props;

  const entries = [ {
    id: idPrefix + '-id',
    component: AttributeId,
    idPrefix,
    attribute
  },{
    id: idPrefix + '-name',
    component: AttributeName,
    idPrefix,
    attribute
  },{
    id: idPrefix + '-type',
    component: AttributeType,
    idPrefix,
    attribute
  },{
    id: idPrefix + '-multi-instance-parameter',
    component: MultiInstanceParameter,
    idPrefix,
    attribute
  },{
    id: idPrefix + '-value',
    component: AttributeValue,
    idPrefix,
    attribute
  },{
    id: idPrefix + '-objective',
    component: AttributeObjective,
    idPrefix,
    attribute
  },{
    id: idPrefix + '-weight',
    component: AttributeWeight,
    idPrefix,
    attribute
  } ];

  return entries;
}

function AttributeId(props) {
  const {
    idPrefix,
    element,
    attribute
  } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: attribute,
      properties: {
        id: value
      }
    });
  };

  const getValue = () => {
    return attribute.id;
  };

  return TextFieldEntry({
    element: attribute,
    id: idPrefix + '-id',
    label: translate('Id'),
    getValue,
    setValue,
    debounce
  });
}

function AttributeName(props) {
  const {
    idPrefix,
    element,
    attribute
  } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: attribute,
      properties: {
        name: value
      }
    });
  };

  const getValue = () => {
    return attribute.name;
  };

  const validate = (value) => {
    if ( !value || value.trim() == "" ) {
      return 'Name must not be empty.';
    }
  }

  return TextFieldEntry({
    element: attribute,
    id: idPrefix + '-name',
    label: translate('Name'),
    validate,
    getValue,
    setValue,
    debounce
  });
}

function AttributeType(props) {
  const {
    idPrefix,
    element,
    attribute
  } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');
//  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: attribute,
      properties: {
        type: value
      }
    });
  };

  const getValue = () => {
    return attribute.type;
  };

  const getOptions = (element) => {
    return [
      { value: 'integer', label: translate('Integer') },
      { value: 'decimal', label: translate('Decimal') },
      { value: 'boolean', label: translate('Boolean') },
      { value: 'string', label: translate('String') },
      { value: 'collection', label: translate('Collection') }
    ];
  };

  return SelectEntry({
    element: attribute,
    id: idPrefix + '-type',
    label: translate('Type'),
    getValue,
    setValue,
    getOptions
  });
}

function AttributeValue(props) {
  const {
    idPrefix,
    element,
    attribute
  } = props;

  let parameter = attribute.get('parameter') || [];
  if ( parameter.length ) {
    return;
  }

  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: attribute,
      properties: {
        value
      }
    });
  };

  const getValue = () => {
    return attribute.value;
  };

  return TextFieldEntry({
    element: attribute,
    id: idPrefix + '-value',
    label: translate('Value'),
    getValue,
    setValue,
    debounce
  });
}

function AttributeObjective(props) {
  const {
    idPrefix,
    element,
    attribute
  } = props;

  if ( !attribute || attribute.get('type') == 'string' ) {
    return;
  }

  const commandStack = useService('commandStack');
  const translate = useService('translate');
//  const debounce = useService('debounceInput');

  const setValue = (value) => {
    if ( value ) {
      commandStack.execute('element.updateModdleProperties', {
        element,
        moddleElement: attribute,
        properties: {
          objective: value
        }
      });
    }
    else {
      commandStack.execute('element.updateModdleProperties', {
        element,
        moddleElement: attribute,
        properties: {
          objective: null,
          weight: null
        }
      });
    }
  };

  const getValue = () => {
    return attribute.objective;
  };

  const getOptions = (element) => {
    return [
      { value: null, label: translate('none') },
      { value: 'minimize', label: translate('minimize') },
      { value: 'maximize', label: translate('maximize') }
    ];
  };

  return SelectEntry({
    element: attribute,
    id: idPrefix + '-objective',
    label: translate('Objective'),
    getValue,
    setValue,
    getOptions
  });
}

function AttributeWeight(props) {
  const {
    idPrefix,
    element,
    attribute
  } = props;

  if ( !attribute || !(attribute.get('objective') == 'maximize' || attribute.get('objective') == 'minimize')) {
    return;
  }
  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: attribute,
      properties: {
        weight: value
      }
    });
  };

  const getValue = () => {
    return attribute.weight;
  };

  return TextFieldEntry({
    element: attribute,
    id: idPrefix + '-weight',
    label: translate('Weight'),
    getValue,
    setValue,
    debounce
  });
}

function MultiInstanceParameter(props) {
  const {
    id,
    element,
    attribute
  } = props;

  if ( !is(element, 'bpmn:Activity') || 
    !element.businessObject.loopCharacteristics ||
    element.businessObject.loopCharacteristics.$type == 'bpmn:StandardLoopCharacteristics'
  ) {
    return;
  }

  const bpmnFactory = useService('bpmnFactory');
  const commandStack = useService('commandStack');
  const translate = useService('translate');

  let parameter = attribute.get('parameter') || [];

  function addParameter() {
    let commands = [];
    if ( (attribute.get('parameter') || []).length ) {
      return;
    }

    // create parameter
    const parameter = createElement('bpmnos:Parameter', { name: 'collection' }, attribute, bpmnFactory);

    commands.push({
      cmd:'element.updateModdleProperties', 
      context: {
        element,
        moddleElement: attribute,
        properties: {
          parameter: [ ...attribute.get('parameter'), parameter ]
        }
      }
    });

    // commit all updates
    commandStack.execute('properties-panel.multi-command-executor', commands);

  }

  function removeParameter(parameter) {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: attribute,
      properties: {
        parameter: without(attribute.get('parameter'), parameter)
      }
    });
  }

  function compareName(parameter, anotherParameter) {
    const [ name = '', anotherName = '' ] = [ parameter.name, anotherParameter.name ];

    return name === anotherName ? 0 : name > anotherName ? 1 : -1;
  }

  return <ListEntry
    id={ id }
    element={ element }
    label={ translate('Multi-instance parameter') }
    items={ parameter }
    component={ Parameter }
    onAdd={ addParameter }
    onRemove={ removeParameter }
    compareFn={ compareName }
    autoFocusEntry
  />;
}



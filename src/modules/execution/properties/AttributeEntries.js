import { TextFieldEntry, SelectEntry } from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';

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

  return TextFieldEntry({
    element: attribute,
    id: idPrefix + '-name',
    label: translate('Name'),
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
      { value: 'xs:integer', label: translate('integer') },
      { value: 'xs:decimal', label: translate('decimal') },
      { value: 'xs:boolean', label: translate('boolean') },
      { value: 'xs:string', label: translate('string') }
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

  const commandStack = useService('commandStack');
  const translate = useService('translate');
//  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: attribute,
      properties: {
        objective: value
      }
    });
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


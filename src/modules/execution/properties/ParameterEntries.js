import { CollapsibleEntry, TextFieldEntry } from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';

export function Parameter(props) {
  const {
    element,
    id: idPrefix,
    index,
    item: parameter,
    open
  } = props;

  const paramId = `${ idPrefix }-${ index }`;
  return (
    <CollapsibleEntry
      entries={ ParameterEntries({
        element,
        parameter,
        idPrefix: paramId
      }) }
      label={ parameter.get('name') || '<empty>' }
      open={ open }
    />
  );

}

export default function ParameterEntries(props) {

  const {
    idPrefix,
    element,
    parameter
  } = props;

  const entries = [ {
    id: idPrefix + '-name',
    component: ParameterName,
    idPrefix,
    parameter
  },{
    id: idPrefix + '-attribute',
    component: ParameterAttribute,
    idPrefix,
    parameter
  },{
    id: idPrefix + '-value',
    component: ParameterValue,
    idPrefix,
    parameter
  } ];

  return entries;
}


function ParameterName(props) {
  const {
    idPrefix,
    element,
    parameter
  } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element: parameter,
      moddleElement: parameter,
      properties: {
        name: value
      }
    });
  };

  const getValue = () => {
    if ( parameter ) {
      return parameter.get('name');
    }
  };

  return TextFieldEntry({
    element: parameter,
    id: idPrefix + '-name',
    label: translate('Name'),
    getValue,
    setValue,
    debounce
  });
}

function ParameterAttribute(props) {
  const {
    idPrefix,
    element,
    parameter
  } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element: parameter,
      moddleElement: parameter,
      properties: {
        attribute: value
      }
    });
  };

  const getValue = () => {
    return parameter.attribute;
  };

  return TextFieldEntry({
    element: parameter,
    id: idPrefix + '-attribute',
    label: translate('Attribute name'),
    getValue,
    setValue,
    debounce
  });
}

function ParameterValue(props) {
  const {
    idPrefix,
    element,
    parameter
  } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element: parameter,
      moddleElement: parameter,
      properties: {
        value
      }
    });
  };

  const getValue = () => {
    return parameter.value;
  };

  return TextFieldEntry({
    element: parameter,
    id: idPrefix + '-value',
    label: translate('Value'),
    getValue,
    setValue,
    debounce
  });
}



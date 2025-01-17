import { CollapsibleEntry, TextFieldEntry, SelectEntry } from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';

import { getStatus, getBusinessObject } from '../utils/StatusUtil';

export function LoopParameter(props) {
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
      entries={ LoopParameterEntries({
        element,
        parameter,
        idPrefix: paramId
      }) }
      label={ ( parameter.get('name') || '<empty>') + " : " +  (parameter.get('attribute') || parameter.get('value') ) }
      open={ open }
    />
  );

}

export default function LoopParameterEntries(props) {

  const {
    idPrefix,
    element,
    parameter
  } = props;

  const entries = [ {
    id: idPrefix + '-name',
    component: LoopParameterName,
    idPrefix,
    parameter
  },{
    id: idPrefix + '-value',
    component: LoopParameterValue,
    idPrefix,
    parameter
  } ];

  return entries;
}


function LoopParameterName(props) {
  const {
    idPrefix,
    element,
    parameter
  } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');
//  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: parameter,
      properties: {
        name: value
      }
    });
  };

  const getValue = () => {
    return parameter.name;
  };

  const getOptions = (element) => {
    return [
      { value: 'index', label: translate('Index attribute') },
      { value: 'cardinality', label: translate('Number of instances') },
      { value: 'condition', label: translate('Loop condition attribute') },
      { value: 'maximum', label: translate('Maximum number of loops') }
    ];
  };

  return SelectEntry({
    element: parameter,
    id: idPrefix + '-name',
    label: translate('Name'),
    getValue,
    setValue,
    getOptions
  });
}

/*
function LoopParameterName(props) {
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

  const validate = (value) => {
    if ( !value || value.trim() == "" ) {
      return 'Name must not be empty.';
    }
  }

  return TextFieldEntry({
    element: parameter,
    id: idPrefix + '-name',
    label: translate('Name'),
    validate,
    getValue,
    setValue,
    debounce
  });
}
*/

function LoopParameterValue(props) {
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



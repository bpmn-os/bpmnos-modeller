import { CollapsibleEntry, TextFieldEntry } from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';

import { getStatus, getBusinessObject } from '../utils/StatusUtil';

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
      label={ ( parameter.get('name') || '<empty>') + " : " +  (parameter.get('attribute') || parameter.get('value') ) }
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

  const validate = (value) => {
    if ( value ) {
      let businessObject = getBusinessObject(parameter);
      const status = getStatus(businessObject);    
      if (status.filter(attribute => attribute.name == value).length == 0) {
        return 'Attribute name does not exist.';
      }
    }
  }

  return TextFieldEntry({
    element: parameter,
    id: idPrefix + '-attribute',
    label: translate('Attribute name'),
//    validate,
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



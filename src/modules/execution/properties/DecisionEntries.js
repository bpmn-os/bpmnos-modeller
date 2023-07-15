import { TextFieldEntry, SelectEntry } from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';

export default function DecisionEntries(props) {

  const {
    idPrefix,
    element,
    decision
  } = props;

  const entries = [ {
    id: idPrefix + '-id',
    component: DecisionId,
    idPrefix,
    decision
  },{
    id: idPrefix + '-attribute',
    component: DecisionAttribute,
    idPrefix,
    decision
  } ];

  return entries;
}

function DecisionId(props) {
  const {
    idPrefix,
    element,
    decision
  } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: decision,
      properties: {
        id: value
      }
    });
  };

  const getValue = () => {
    return decision.id;
  };

  return TextFieldEntry({
    element: decision,
    id: idPrefix + '-id',
    label: translate('Id'),
    getValue,
    setValue,
    debounce
  });
}

function DecisionAttribute(props) {
  const {
    idPrefix,
    element,
    decision
  } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: decision,
      properties: {
        attribute: value
      }
    });
  };

  const getValue = () => {
    return decision.attribute;
  };

  const validate = (value) => {
    if ( !value || value.trim() == "" ) {
      return 'Attribute name must not be empty.';
    }
  }

  return TextFieldEntry({
    element: decision,
    id: idPrefix + '-attribute',
    label: translate('Attribute name'),
    validate,
    getValue,
    setValue,
    debounce
  });
}

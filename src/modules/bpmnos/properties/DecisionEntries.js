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
    id: idPrefix + '-condition',
    component: DecisionCondition,
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

function DecisionCondition(props) {
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
        condition: value
      }
    });
  };

  const getValue = () => {
    return decision.condition;
  };

  const validate = (value) => {
    if ( !value || value.trim() == "" ) {
      return 'Condition must not be empty.';
    }
  }

  return TextFieldEntry({
    element: decision,
    id: idPrefix + '-condition',
    label: translate('Condition'),
    validate,
    getValue,
    setValue,
    debounce
  });
}

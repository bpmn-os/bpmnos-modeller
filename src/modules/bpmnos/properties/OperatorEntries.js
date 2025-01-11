import { TextFieldEntry } from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';

import { getStatus, getBusinessObject } from '../utils/StatusUtil';

import {
  createElement
} from '../utils/ElementUtil';

import { without } from 'min-dash';

export default function OperatorEntries(props) {

  const {
    idPrefix,
    element,
    operator
  } = props;

  const entries = [ {
    id: idPrefix + '-id',
    component: OperatorId,
    idPrefix,
    operator
  },{
    id: element.id + '-expression',
    component: OperatorExpression,
    idPrefix,
    operator
  } ];

  return entries;
}

function OperatorId(props) {
  const {
    idPrefix,
    element,
    operator
  } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: operator,
      properties: {
        id: value
      }
    });
  };

  const getValue = () => {
    if ( operator ) {
      return operator.get('id');
    }
  };

  return TextFieldEntry({
    element: operator,
    id: idPrefix + '-id',
    label: translate('Id'),
    getValue,
    setValue,
    debounce
  });
}

function OperatorExpression(props) {
  const {
    idPrefix,
    element,
    operator
  } = props;

  const modeling = useService('modeling');
  const debounce = useService('debounceInput');
  const translate = useService('translate');
  const commandStack = useService('commandStack');
  const bpmnFactory = useService('bpmnFactory');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: operator,
      properties: {
        expression: value,
      }
    });
  };

  const getValue = (element) => {
    return operator.expression;
  };

  const validate = (value) => {
    if ( !value || !value.length ) {
      return 'Expression must not be empty.';
    }
  }

  return TextFieldEntry({
    element,
    id: 'value',
    label: translate('Expression'),
    validate,
    getValue,
    setValue,
    debounce
  });
}

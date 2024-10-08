import { TextFieldEntry, SelectEntry, ListEntry } from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';

import { Parameter, ParameterEntries } from './ParameterEntries';

import { getStatus, getBusinessObject } from '../utils/StatusUtil';

import {
  createElement
} from '../utils/ElementUtil';

import { without } from 'min-dash';

import operatorOptions from '../operators.json';

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
    id: idPrefix + '-attribute',
    component: OperatorAttributeName,
    idPrefix,
    operator
  },{
    id: idPrefix + '-type',
    component: OperatorType,
    idPrefix,
    operator
  },{
    id: idPrefix + '-parameters',
    component: OperatorParameters,
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

function OperatorType(props) {
  const {
    idPrefix,
    element,
    operator
  } = props;

  const commandStack = useService('commandStack');
  const bpmnFactory = useService('bpmnFactory');
  const translate = useService('translate');

  const setValue = (value) => {
    const option = operatorOptions.find(op => op.value == value) || {};
    let parameters = [];
    if ( option.parameters ) {
      for (var i=0; i < option.parameters.length; i++ ) {
        parameters.push( createElement('bpmnos:Parameter', option.parameters[i], operator, bpmnFactory) );
      }
    }
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: operator,
      properties: {
        type: value,
        parameter: parameters
      }
    });
  };

  const getValue = () => {
    if ( operator ) {
      return operator.get('type');
    }
  };

  const getOptions = (element) => {
    return operatorOptions;
  };

  return SelectEntry({
    element: operator,
    id: idPrefix + '-type',
    label: translate('Type'),
    getValue,
    setValue,
    getOptions
  });
}

function OperatorAttributeName(props) {
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
        attribute: value
      }
    });
  };

  const getValue = () => {
    if ( operator ) {
      return operator.get('attribute');
    }
  };

  const validate = (value) => {
/*
    if ( value ) {
      let businessObject = getBusinessObject(operator);
      const status = getStatus(businessObject);    
      if (status.filter(attribute => attribute.name == value).length == 0) {
        return 'Attribute name does not exist.';
      }
    }
    else {
*/
    if ( !value || !value.length ) {
      return 'Attribute name must not be empty.';
    }
  }

  return TextFieldEntry({
    element: operator,
    id: idPrefix + '-attribute',
    label: translate('Attribute name'),
    validate,
    getValue,
    setValue,
    debounce
  });
}

function OperatorParameters(props) {
  const {
    id,
    element,
    operator
  } = props;

  const bpmnFactory = useService('bpmnFactory');
  const commandStack = useService('commandStack');
  const translate = useService('translate');

  let parameter = operator.get('parameter') || [];

  function addParameter() {
    let commands = [];

    // create parameter
    const parameter = createElement('bpmnos:Parameter', {}, operator, bpmnFactory);

    commands.push({
      cmd:'element.updateModdleProperties', 
      context: {
        element,
        moddleElement: operator,
        properties: {
          parameter: [ ...operator.get('parameter'), parameter ]
        }
      }
    });

    // commit all updates
    commandStack.execute('properties-panel.multi-command-executor', commands);

  }

  function removeParameter(parameter) {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: operator,
      properties: {
        parameter: without(operator.get('parameter'), parameter)
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
    label={ translate('Parameters') }
    items={ parameter }
    component={ Parameter }
    onAdd={ addParameter }
    onRemove={ removeParameter }
    compareFn={ compareName }
    autoFocusEntry
  />;
}



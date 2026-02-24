import { TextFieldEntry, SelectEntry } from '@bpmn-io/properties-panel';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import { useService } from 'bpmn-js-properties-panel';

import { getStatus, getBusinessObject } from '../utils/StatusUtil';

import {
  createElement
} from '../utils/ElementUtil';

import { without } from 'min-dash';

export default function RestrictionEntries(props) {

  const {
    idPrefix,
    element,
    restriction
  } = props;

  const entries = [ {
    id: idPrefix + '-id',
    component: RestrictionId,
    idPrefix,
    restriction
  },{
    id: element.id + '-scope',
    component: RestrictionScope,
    idPrefix,
    restriction
  },{
    id: element.id + '-expression',
    component: RestrictionExpression,
    idPrefix,
    restriction
  } ];

  return entries;
}

function RestrictionId(props) {
  const {
    idPrefix,
    element,
    restriction
  } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');
  const bpmnFactory = useService('bpmnFactory');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: restriction,
      properties: {
        id: value
      }
    });
  };

  const getValue = () => {
    return restriction.id;
  };

  return TextFieldEntry({
    element: restriction,
    id: idPrefix + '-id',
    label: translate('Id'),
    getValue,
    setValue,
    debounce
  });
}

function RestrictionScope(props) {
  const {
    idPrefix,
    element,
    restriction
  } = props;

  if ( is(element, 'bpmn:SequenceFlow') || is(element, 'bpmn:Event') ) {
    return;
  }


  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const bpmnFactory = useService('bpmnFactory');
//  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: restriction,
      properties: {
        scope: value
      }
    });
  };

  const getValue = () => {
    return restriction.scope || 'full';
  };

  const getOptions = (element) => {
    return [
      { value: 'full', label: translate('full') },
      { value: 'entry', label: translate('entry') },
      { value: 'completion', label: translate('completion') },
      { value: 'exit', label: translate('exit') }
    ];
  };

  return SelectEntry({
    element: restriction,
    id: idPrefix + '-scope',
    label: translate('Scope'),
    getValue,
    setValue,
    getOptions
  });
}

function RestrictionExpression(props) {
  const {
    idPrefix,
    element,
    restriction
  } = props;

  const modeling = useService('modeling');
  const debounce = useService('debounceInput');
  const translate = useService('translate');
  const commandStack = useService('commandStack');
  const bpmnFactory = useService('bpmnFactory');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: restriction,
      properties: {
        expression: value,
      }
    });
  };

  const getValue = (element) => {
    return restriction.expression;
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

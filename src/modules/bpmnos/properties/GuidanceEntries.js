import { SelectEntry } from '@bpmn-io/properties-panel';

import {
  is,
  isAny
} from 'bpmn-js/lib/util/ModelUtil';

import {
  getRelevantBusinessObject,
} from '../utils/CustomItemUtil';

import {
  isMessageSupported
} from '../utils/EventDefinitionUtil';

import { useService } from 'bpmn-js-properties-panel';

import AttributesList from './GuidingAttributesList';
import RestrictionsList from './GuidingRestrictionsList';
import OperatorsList from './GuidingOperatorsList';

export default function GuidanceEntries(props) {
  const {
    idPrefix,
    element,
    guidance
  } = props;

  const entries = [ 
    {
      id: idPrefix + '-type',
      component: GuidanceType,
      idPrefix,
      guidance
    },
    {
      id: idPrefix + '-attributes',
      component: AttributesList,
      idPrefix,
      guidance
    },
    {
      id: idPrefix + '-restrictions',
      component: RestrictionsList,
      idPrefix,
      guidance
    },
    {
      id: idPrefix + '-operators',
      component: OperatorsList,
      idPrefix,
      guidance
    }
  ];

  return entries;
}

function GuidanceType(props) {
  const {
    idPrefix,
    element,
    guidance
  } = props;

  let businessObject = getRelevantBusinessObject(element);

  let guidanceTypes = [ { label: 'Entry decision', value: 'entry' } , { label: 'Exit decision', value: 'exit' } ];
  if ( is(element, 'bpmn:Task') && businessObject.type == "Decision" ) {
    guidanceTypes.push({ label: 'Choice', value: 'choice' });
  }
  else if ( is(element, 'bpmn:ReceiveTask') ) {
    guidanceTypes.push({ label: 'Message delivery', value: 'message' });
  }
  else if ( is(element, 'bpmn:CatchEvent') && isMessageSupported(element) ) {
    guidanceTypes = [ { label: 'Message delivery', value: 'message' } ];
  }

  const commandStack = useService('commandStack');
  const bpmnFactory = useService('bpmnFactory');
  const translate = useService('translate');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: guidance,
      properties: {
        type: value
      }
    });
  };

  const getValue = () => {
    if ( guidance ) {
      let value = guidance.get('type');
      if ( !value ) {
        value = guidanceTypes[0].value;
        commandStack.execute('element.updateModdleProperties', {
          element,
          moddleElement: guidance,
          properties: {
            type: value
          }
        });

      }
      return value;
    }
  };

  const getOptions = (element) => {
    return guidanceTypes;
  };

  return SelectEntry({
    element: guidance,
    id: idPrefix + '-type',
    label: translate('Type'),
    getValue,
    setValue,
    getOptions
  });
}


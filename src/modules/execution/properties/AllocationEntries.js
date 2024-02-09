import {
  isAny
} from 'bpmn-js/lib/util/ModelUtil';

import { ListEntry, TextFieldEntry } from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';

import { Content, ContentEntries } from './ContentEntries';

import {
  createElement,
  nextId
} from '../utils/ElementUtil';

import { without } from 'min-dash';

import {
  getCustomItem
} from '../utils/CustomItemUtil';

export default function AllocationEntries(props) {
  const {
    idPrefix,
    allocation
  } = props;

  const entries = [ {
    id: idPrefix + '-id',
    component: AllocationId,
    idPrefix,
    allocation
   }
  ];

  return entries;
}

function AllocationId(props) {
  const {
    idPrefix,
    element,
    allocation
  } = props;

  const elementRegistry = useService('elementRegistry');
  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    let commands = [];

    const messageTasks = element.businessObject.flowElements.filter( child => isAny(child, [ 'bpmn:SendTask', 'bpmn:ReceiveTask'] ) );

    for ( let messageTask of messageTasks ) {
      let messageTaskElement = elementRegistry.get(messageTask.id);
      const messages = getCustomItem( messageTaskElement, 'execution:Messages' ) || {};
      for (let message of messages.get('message') ) {
        for (let parameter of message.parameter || [] ) {
          if ( parameter.name == 'allocation' && parameter.value == allocation.id ) {
            commands.push({
              cmd: 'element.updateModdleProperties', 
              context: {
                element: messageTaskElement,
                moddleElement: parameter,
                properties: {
                  value
                }
              }
            });
          }
        }
        for (let content of message.content || [] ) {
          if ( content.key == 'AllocationID' && content.value == allocation.id ) {
            commands.push({
              cmd: 'element.updateModdleProperties', 
              context: {
                element: messageTaskElement,
                moddleElement: content,
                properties: {
                  value
                }
              }
            });
          }
        }
      }

    }

    commands.push({
      cmd: 'element.updateModdleProperties', 
      context: {
        element,
        moddleElement: allocation,
        properties: {
          id: value
        }
      }
    });

    // commit all updates
    commandStack.execute('properties-panel.multi-command-executor', commands);
  };

  const getValue = () => {
    return allocation.id;
  };

  return TextFieldEntry({
    element: allocation,
    id: idPrefix + '-id',
    label: translate('Id'),
    getValue,
    setValue,
    debounce
  });
}

import {
  getBusinessObject,
  isAny
} from 'bpmn-js/lib/util/ModelUtil';

import MessageEntries from './MessageEntries';

import {
  createElement,
  nextId
} from '../utils/ElementUtil';

import {
  getCustomItem,
  ensureCustomItem
} from '../utils/CustomItemUtil';

import { without } from 'min-dash';

// Creates messages entry and returns { items, add }
export function multiMessageHandler({ element, injector }) {
  let businessObject = getBusinessObject(element);

  if (!isAny(element, ['bpmn:ReceiveTask', 'bpmn:SendTask'] ) ) {
    return;
  }

  const bpmnFactory = injector.get('bpmnFactory'),
        commandStack = injector.get('commandStack');

  const messages = getCustomItem( element, 'execution:Messages' ) || {};

  const items = ( messages.message || []).map((message, index) => {
    const id = element.id + '-message-' + index;

    return {
      id,
      label: message.get('name'),
      entries: MessageEntries({
        idPrefix: id,
        element,
        message
      }),
      autoFocusEntry: id + '-name',
      remove: removeFactory({ commandStack, element, message })
    };
  });

  return {
    items,
    add: addFactory({ bpmnFactory, commandStack, element }),
    shouldSort: false
  };
}

// ADD FACTORY //

function addFactory({ bpmnFactory, commandStack, element }) {
  return function(event) {
    event.stopPropagation();

    let messages = ensureCustomItem(bpmnFactory, commandStack, element, 'execution:Messages'); 

    // create 'execution:Message'
//    let message = createElement('execution:Message', { id: nextId('Message_') }, messages, bpmnFactory);
    let message = createElement('execution:Message', { }, messages, bpmnFactory);

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: messages,
      properties: {
        message: [ ...messages.get('message'), message ]
      }
    });
  };
}

// REMOVE FACTORY //
function removeFactory({ commandStack, element, message }) {
  return function(event) {
    event.stopPropagation();

    const commands = [];

    const businessObject = getBusinessObject(element);

    let messages = getCustomItem( element, 'execution:Messages' );

    if (!messages) {
      return;
    }

    const messageList = without(messages.get('message'), message);

    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: messages,
        properties: {
          message: messageList
        }
      }
    });


    // remove 'execution:Messages' if there are no messages anymore
    if (!messageList.length) {
      const extensionElements = businessObject.get('extensionElements');

      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: extensionElements,
          properties: {
            values: without(extensionElements.values, messages)
          }
        }
      });
    }

    commandStack.execute('properties-panel.multi-command-executor', commands);
  };
}


import {
  getBusinessObject,
  is,
  isAny
} from 'bpmn-js/lib/util/ModelUtil';

import AllocationEntries from './AllocationEntries';

import {
  createElement,
  nextId
} from '../utils/ElementUtil';

import {
  getCustomItem,
  ensureCustomItem
} from '../utils/CustomItemUtil';

import { without } from 'min-dash';


// Creates allocations entry and returns { items, add }
export function allocationHandler({ element, injector }) {
  let businessObject = getBusinessObject(element);

  // do not offer for empty pools
  if (!businessObject) {
    return;
  }

  if ( !is(element, 'bpmn:Activity') || 
    ( getBusinessObject(element).type != "Request" && getBusinessObject(element).type != "Release" )
  ) {
    return;
  }

  const elementRegistry = injector.get('elementRegistry'),
        bpmnFactory = injector.get('bpmnFactory'),
        commandStack = injector.get('commandStack');

  const allocations = getCustomItem( element, 'execution:Allocations' ) || {};

  const items = ( allocations.allocation || []).map((allocation, index) => {
    const id = element.id + '-allocation-' + index;

    return {
      id,
      label: allocation.get('id') || 'Allocation ' + index,
      entries: AllocationEntries({
        idPrefix: id,
        element,
        allocation
      }),
      autoFocusEntry: id + '-id',
      remove: removeFactory({ elementRegistry, commandStack, element, allocation })
    };
  });

  return {
    items,
    add: addFactory({ elementRegistry, bpmnFactory, commandStack, element })
  };
}

// ADD FACTORY //

function addFactory({ elementRegistry, bpmnFactory, commandStack, element }) {
  return function(event) {
    event.stopPropagation();

    let allocations = ensureCustomItem(bpmnFactory, commandStack, element, 'execution:Allocations'); 

    // create 'execution:Allocation'
    let allocation = createElement('execution:Allocation', { id: nextId('Allocation_') }, allocations, bpmnFactory);

    let commands = [];

    commands.push({
      cmd: 'element.updateModdleProperties', 
      context: {
        element,
        moddleElement: allocations,
        properties: {
          allocation: [ ...allocations.get('allocation'), allocation ]
        }
      }
    });

    const messageTasks = element.businessObject.flowElements.filter( child => isAny(child, [ 'bpmn:SendTask', 'bpmn:ReceiveTask'] ) );
    for ( let messageTask of messageTasks ) {
      let messageTaskElement = elementRegistry.get(messageTask.id);
      let messages = ensureCustomItem(bpmnFactory, commandStack, messageTaskElement, 'execution:Messages');

      // Remove 'Send ' or 'Receive ' from task name and capitalize first letter of message name 
      let name = messageTask.name.split(' ').slice(1).join(' ');
      name = name[0].toUpperCase() + name.slice(1);

      // create 'execution:Message'
      let message = createElement('execution:Message', { name }, messages, bpmnFactory);

      commandStack.execute('element.updateModdleProperties', {
        element: messageTaskElement,
        moddleElement: messages,
        properties: {
          message: [ ...messages.get('message'), message ]
        }
      });

      // create 'execution:Parameter'
      let parameter = createElement('execution:Parameter', { name: 'allocation', value: allocation.id }, message, bpmnFactory);

      commandStack.execute('element.updateModdleProperties', {
        element: messageTaskElement,
        moddleElement: message,
        properties: {
          parameter: [ parameter ]
        }
      });

      if ( name == 'Request message' ) {
        // create 'execution:Content'
        let clientContent = createElement('execution:Content', { id: nextId('Content_'), key: 'ClientID', attribute: 'instance' }, message, bpmnFactory);
        let allocationContent = createElement('execution:Content', { id: nextId('Content_'), key: 'AllocationID', value: allocation.id }, message, bpmnFactory);

        commandStack.execute('element.updateModdleProperties', {
          element: messageTaskElement,
          moddleElement: message,
          properties: {
            content: [ clientContent, allocationContent ]
          }
        });
      }

    }
    // commit all updates
    commandStack.execute('properties-panel.multi-command-executor', commands);
  };
}

// REMOVE FACTORY //
function removeFactory({ elementRegistry, commandStack, element, allocation }) {
  return function(event) {
    event.stopPropagation();

    const commands = [];

    const businessObject = getBusinessObject(element);

    let allocations = getCustomItem(element,'execution:Allocations');

    if (!allocations) {
      return;
    }

    let index = allocations.get('allocation').findIndex( element => element.id == allocation.id );

    const messageTasks = element.businessObject.flowElements.filter( child => isAny(child, [ 'bpmn:SendTask', 'bpmn:ReceiveTask'] ) );

    for ( let messageTask of messageTasks ) {
      let messageTaskElement = elementRegistry.get(messageTask.id);
      let messages = getCustomItem(messageTaskElement, 'execution:Messages'); 
      if ( messages.get('message').length > index ) {
        // TODO: identify message by allocation id not by index
        commandStack.execute('element.updateModdleProperties', {
          element: messageTaskElement,
          moddleElement: messages,
          properties: {
            message: without(messages.get('message'), messages.get('message')[index]) 
          }
        });
      }
    }

    const allocationList = without(allocations.get('allocation'), allocation);

    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: allocations,
        properties: {
          allocation: allocationList
        }
      }
    });

    // remove 'execution:Allocations' if there are no allocations anymore
    if (!allocationList.length) {
      const extensionElements = businessObject.get('extensionElements');

      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: extensionElements,
          properties: {
            values: without(extensionElements.values, allocations)
          }
        }
      });
    }

    commandStack.execute('properties-panel.multi-command-executor', commands);
  };
}



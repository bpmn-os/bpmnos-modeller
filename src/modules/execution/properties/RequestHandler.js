import {
  getBusinessObject,
  is
} from 'bpmn-js/lib/util/ModelUtil';

import RequestEntries from './RequestEntries';

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
export function requestHandler({ element, injector }) {
  let businessObject = getBusinessObject(element);

  // do not offer for empty pools
  if (!businessObject) {
    return;
  }

  if ( !is(element, 'bpmn:Activity') || getBusinessObject(element).type != "Request") {
    return;
  }

  const bpmnFactory = injector.get('bpmnFactory'),
        commandStack = injector.get('commandStack');

  const allocations = getCustomItem( element, 'execution:Allocations' ) || {};

  const items = ( allocations.request || []).map((request, index) => {
    const id = element.id + '-request-' + index;

    return {
      id,
      label: request.get('id') || 'Request ' + index,
      entries: RequestEntries({
        idPrefix: id,
        element,
        request
      }),
      autoFocusEntry: id + '-id',
      remove: removeFactory({ commandStack, element, request })
    };
  });

  return {
    items,
    add: addFactory({ bpmnFactory, commandStack, element })
  };
}

// ADD FACTORY //

function addFactory({ bpmnFactory, commandStack, element }) {
  return function(event) {
    event.stopPropagation();

    let allocations = ensureCustomItem(bpmnFactory, commandStack, element, 'execution:Allocations'); 

    // create 'execution:Request'
    let request = createElement('execution:Request', { id: nextId('Request_') }, allocations, bpmnFactory);

    let commands = [];

    commands.push({
      cmd: 'element.updateModdleProperties', 
      context: {
        element,
        moddleElement: allocations,
        properties: {
          request: [ ...allocations.get('request'), request ]
        }
      }
    });

    let message = createElement('execution:Message', { name: 'Request message' }, request, bpmnFactory);
    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: request,
        properties: {
          message: [ ...request.get('message'), message ]
        }
      }
    });

    // create request message content
    const content1 = createElement('execution:Content', { id: nextId('Content_'), key: 'ClientID', attribute: 'instance' }, message, bpmnFactory);
    const content2 = createElement('execution:Content', { id: nextId('Content_'), key: 'RequestID', value: request.id }, message, bpmnFactory);

    commands.push({
      cmd: 'element.updateModdleProperties', 
      context: {
        element,
        moddleElement: message,
        properties: {
          content: [ ...message.get('content'), content1, content2 ]
        }
      }
    });

    // commit all updates
    commandStack.execute('properties-panel.multi-command-executor', commands);
  };
}

// REMOVE FACTORY //
function removeFactory({ commandStack, element, request }) {
  return function(event) {
    event.stopPropagation();

    const commands = [];

    const businessObject = getBusinessObject(element);

    let allocations = getCustomItem(element,'execution:Allocations');

    if (!allocations) {
      return;
    }

    const requests = without(allocations.get('request'), request);

    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: allocations,
        properties: {
          request: requests
        }
      }
    });

    // remove 'execution:Allocations' if there are no requests anymore
    if (!requests.length) {
      const businessObject = getBusinessObject(element),
            extensionElements = businessObject.get('extensionElements');

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



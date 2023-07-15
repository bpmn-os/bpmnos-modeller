import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import DecisionEntries from './DecisionEntries';

import {
  createElement,
  nextId
} from '../utils/ElementUtil';

import {
  getRelevantBusinessObject,
  getCustomItem,
  ensureCustomItem
} from '../utils/CustomItemUtil';

import { without } from 'min-dash';


// Creates decisions entry and returns { items, add }
export function decisionHandler({ element, injector }) {
  let businessObject = getRelevantBusinessObject(element);

  // do not offer for empty pools
  if (!businessObject) {
    return;
  }

  if ( !is(element, 'bpmn:Task') || getRelevantBusinessObject(element).type != "Decision" ) {
    return;
  }

  const bpmnFactory = injector.get('bpmnFactory'),
        commandStack = injector.get('commandStack');

  const decisions = getCustomItem( element, 'execution:Decisions' ) || {};

  const items = ( decisions.decision || []).map((decision, index) => {
    const id = element.id + '-decision-' + index;

    return {
      id,
      label: decision.get('name') || decision.get('id'),
      entries: DecisionEntries({
        idPrefix: id,
        element,
        decision
      }),
      autoFocusEntry: id + '-name',
      remove: removeFactory({ commandStack, element, decision })
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

    const decisions = ensureCustomItem(bpmnFactory, commandStack, element, 'execution:Decisions'); 

    // create 'execution:Decision'
    const decision = createElement('execution:Decision', { id: nextId('Decision_') }, decisions, bpmnFactory);

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: decisions,
      properties: {
        decision: [ ...decisions.get('decision'), decision ]
      }
    });

  };
}

// REMOVE FACTORY //
function removeFactory({ commandStack, element, decision }) {
  return function(event) {
    event.stopPropagation();

    const commands = [];

    const businessObject = getRelevantBusinessObject(element);

    let decisions = getCustomItem(element,'execution:Decisions');

    if (!decisions) {
      return;
    }

    const decisionList = without(decisions.get('decision'), decision);

    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: decisions,
        properties: {
          decision: decisionList
        }
      }
    });

    // remove 'execution:Decisions' if there are no decisions anymore
    if (!decisionList.length) {
      const businessObject = getRelevantBusinessObject(element),
            extensionElements = businessObject.get('extensionElements');

      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: extensionElements,
          properties: {
            values: without(extensionElements.values, decisions)
          }
        }
      });
    }

    commandStack.execute('properties-panel.multi-command-executor', commands);
  };
}


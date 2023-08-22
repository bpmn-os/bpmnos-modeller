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

  const parent = getCustomItem( element, 'execution:Status' ) || {};
  const decisions = parent.decisions ? parent.get('decisions')[0] : {};

  const items = ( decisions.decision || []).map((decision, index) => {
    const id = element.id + '-decision-' + index;

    return {
      id,
      label: decision.get('attribute') || decision.get('id'),
      entries: DecisionEntries({
        idPrefix: id,
        element,
        decision
      }),
      autoFocusEntry: id + '-attribute',
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

    const parent = ensureCustomItem(bpmnFactory, commandStack, element, 'execution:Status'); 

    let decisions = parent.decisions ? parent.get('decisions')[0] : undefined;
    if ( !decisions ) {
      // create 'execution:Decisions'
      decisions = createElement('execution:Decisions', {}, parent, bpmnFactory);
      commandStack.execute('element.updateModdleProperties', {
          element,
          moddleElement: parent,
          properties: {
            decisions: [ ...parent.get('decisions'), decisions ]
          }
      });
    }

    // create 'execution:Decision'
    let decision = createElement('execution:Decision', { id: nextId('Decision_') }, decisions, bpmnFactory);

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

    const parent = getCustomItem( element, 'execution:Status' ) || {};
    let decisions = parent.decisions ? parent.get('decisions')[0] : {};

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
      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: parent,
          properties: {
            decisions: undefined
          }
        }
      });
    }

    commandStack.execute('properties-panel.multi-command-executor', commands);
  };
}


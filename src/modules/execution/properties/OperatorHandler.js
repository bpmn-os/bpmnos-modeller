import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import OperatorEntries from './OperatorEntries';

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

// Creates operators entry and returns { items, add }
export function operatorHandler({ element, injector }) {
  let businessObject = getRelevantBusinessObject(element);

  // do not offer for empty pools
  if (!businessObject) {
    return;
  }

  if ( !is(businessObject, 'bpmn:Process') && !is(businessObject, 'bpmn:Activity') ) {
    return;
  }
  if ( is(element, 'bpmn:Activity') && ( getRelevantBusinessObject(element).type == "Request" || getRelevantBusinessObject(element).type == "Release") ) {
    return;
  }

  const bpmnFactory = injector.get('bpmnFactory'),
        commandStack = injector.get('commandStack');

  const operators = getCustomItem( element, 'execution:Operators' ) || {};

  const items = ( operators.operator || []).map((operator, index) => {
    const id = element.id + '-operator-' + index;

    return {
      id,
      label: operator.get('attribute') || operator.get('id'),
      entries: OperatorEntries({
        idPrefix: id,
        element,
        operator
      }),
      autoFocusEntry: id + '-attribute',
      remove: removeFactory({ commandStack, element, operator })
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

    let operators = ensureCustomItem(bpmnFactory, commandStack, element, 'execution:Operators'); 

    // create 'execution:Operator'
    let operator = createElement('execution:Operator', { id: nextId('Operator_') , type: 'xs:decimal' }, operators, bpmnFactory);

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: operators,
      properties: {
        operator: [ ...operators.get('operator'), operator ]
      }
    });
  };
}

// REMOVE FACTORY //
function removeFactory({ commandStack, element, operator }) {
  return function(event) {
    event.stopPropagation();

    const commands = [];

    const businessObject = getRelevantBusinessObject(element);

    let operators = getCustomItem(element,'execution:Operators');

    if (!operators) {
      return;
    }

    const operatorList = without(operators.get('operator'), operator);

    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: operators,
        properties: {
          operator: operatorList
        }
      }
    });

    // remove 'execution:Operators' if there are no operators anymore
    if (!operatorList.length) {
      const businessObject = getRelevantBusinessObject(element),
            extensionElements = businessObject.get('extensionElements');

      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: extensionElements,
          properties: {
            values: without(extensionElements.values, operators)
          }
        }
      });
    }

    commandStack.execute('properties-panel.multi-command-executor', commands);
  };
}


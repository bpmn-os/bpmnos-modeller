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
  if ( is(element, 'bpmn:Activity') && ( businessObject.type == "Request" || businessObject.type == "Release") ) {
    return;
  }

  const bpmnFactory = injector.get('bpmnFactory'),
        commandStack = injector.get('commandStack');

  const parent = getCustomItem( element, 'bpmnos:Status' ) || {};
  const operators = parent.operators ? parent.get('operators')[0] : {};


  const items = ( operators.operator || []).map((operator, index) => {
    const id = element.id + '-operator-' + index;

    return {
      id,
      label: operator.get('parameter').length && operator.get('attribute') ? ( operator.get('attribute') + " ← " + ( operator.get('parameter')[0].attribute || operator.get('parameter')[0].value ))  : operator.get('id'),
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

    const parent = ensureCustomItem(bpmnFactory, commandStack, element, 'bpmnos:Status'); 

    let operators = parent.operators ? parent.get('operators')[0] : undefined;
    if ( !operators ) {
      // create 'bpmnos:Operators'
      operators = createElement('bpmnos:Operators', {}, parent, bpmnFactory);
      commandStack.execute('element.updateModdleProperties', {
          element,
          moddleElement: parent,
          properties: {
            operators: [ ...parent.get('operators'), operators ]
          }
      });
    }

    // create 'bpmnos:Operator'
    let operator = createElement('bpmnos:Operator', { id: nextId('Operator_') , type: 'unset' }, operators, bpmnFactory);

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

    const parent = getCustomItem( element, 'bpmnos:Status' ) || {};
    let operators = parent.operators ? parent.get('operators')[0] : {};

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

    // remove 'bpmnos:Operators' if there are no operators anymore
    if (!operatorList.length) {
      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: parent,
          properties: {
            operators: undefined
          }
        }
      });
    }

    commandStack.execute('properties-panel.multi-command-executor', commands);
  };
}


import {
  getBusinessObject,
  is
} from 'bpmn-js/lib/util/ModelUtil';

import ParameterEntries from './ParameterEntries';

import {
  createElement,
  nextId
} from '../utils/ElementUtil';

import {
  getCustomItem,
  ensureCustomItem
} from '../utils/CustomItemUtil';

import { without } from 'min-dash';

// Creates loop entry and returns { items, add }
export function loopHandler({ element, injector }) {
  let businessObject = getBusinessObject(element);

  if ( !is(element, 'bpmn:Activity') || !businessObject.loopCharacteristics ) {
    return;
  }

  const bpmnFactory = injector.get('bpmnFactory'),
        commandStack = injector.get('commandStack');

  const loopCharacteristics = getCustomItem( element, 'execution:LoopCharacteristics' ) || {};

  const items = ( loopCharacteristics.parameter || []).map((parameter, index) => {
    const id = element.id + '-parameter-' + index;

    return {
      id,
      label: parameter.get('name'),
      entries: ParameterEntries({
        idPrefix: id,
        element,
        parameter
      }),
      autoFocusEntry: id + '-name',
      remove: removeFactory({ commandStack, element, parameter })
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

    let loopCharacteristics = ensureCustomItem(bpmnFactory, commandStack, element, 'execution:LoopCharacteristics'); 

    // create 'execution:Parameter'
    let parameter = createElement('execution:Parameter', { }, loopCharacteristics, bpmnFactory);

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: loopCharacteristics,
      properties: {
        parameter: [ ...loopCharacteristics.get('parameter'), parameter ]
      }
    });
  };
}

// REMOVE FACTORY //
function removeFactory({ commandStack, element, parameter }) {
  return function(event) {
    event.stopPropagation();

    const commands = [];

    const businessObject = getBusinessObject(element);

    let loopCharacteristics = getCustomItem( element, 'execution:LoopCharacteristics' );

    if (!loopCharacteristics) {
      return;
    }

    const parameters = without(loopCharacteristics.get('parameter'), parameter);

    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: loopCharacteristics,
        properties: {
          parameter: parameters
        }
      }
    });


    // remove 'execution:LoopCharacteristics' if there are no loop characteristics anymore
    if (!parameters.length) {
      const extensionElements = businessObject.get('extensionElements');

      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: extensionElements,
          properties: {
            values: without(extensionElements.values, loopCharacteristics)
          }
        }
      });
    }

    commandStack.execute('properties-panel.multi-command-executor', commands);
  };
}


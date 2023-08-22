import {
  is,
  isAny
} from 'bpmn-js/lib/util/ModelUtil';

import RestrictionEntries from './RestrictionEntries';

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

// Creates restrictions entry and returns { items, add }
export function restrictionHandler({ element, injector }) {
  let businessObject = getRelevantBusinessObject(element);

  // do not offer for empty pools
  if (!businessObject) {
    return;
  }

  if ( !isAny(businessObject, [ 'bpmn:Process', 'bpmn:Activity' , 'bpmn:SequenceFlow']) ) {
    return;
  }
  if ( is(businessObject, 'bpmn:Activity') && ( businessObject.type == "Request" || businessObject.type == "Release") ) {
    return;
  }

  const bpmnFactory = injector.get('bpmnFactory'),
        commandStack = injector.get('commandStack');

  const parent = getCustomItem( element, 'execution:Status' ) || {};
  const restrictions = parent.restrictions ? parent.get('restrictions')[0] : {};


  const items = ( restrictions.restriction || []).map((restriction, index) => {
    const id = element.id + '-restriction-' + index;

    return {
      id,
      label: restriction.get('attribute') || restriction.get('id'),
      entries: RestrictionEntries({
        idPrefix: id,
        element,
        restriction
      }),
      autoFocusEntry: id + '-attribute',
      remove: removeFactory({ commandStack, element, restriction })
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

    const parent = ensureCustomItem(bpmnFactory, commandStack, element, 'execution:Status'); 

    let restrictions = parent.restrictions ? parent.get('restrictions')[0] : undefined;
    if ( !restrictions ) {
      // create 'execution:Restrictions'
      restrictions = createElement('execution:Restrictions', {}, parent, bpmnFactory);
      commandStack.execute('element.updateModdleProperties', {
          element,
          moddleElement: parent,
          properties: {
            restrictions: [ ...parent.get('restrictions'), restrictions ]
          }
      });
    }

    // create 'execution:Restriction'
    const restriction = createElement('execution:Restriction', { id: nextId('Restriction_') }, restrictions, bpmnFactory);

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: restrictions,
      properties: {
        restriction: [ ...restrictions.get('restriction'), restriction ]
      }
    });
  };
}

// REMOVE FACTORY //
function removeFactory({ commandStack, element, restriction }) {
  return function(event) {
    event.stopPropagation();

    const commands = [];

    const businessObject = getRelevantBusinessObject(element);

    const parent = getCustomItem( element, 'execution:Status' ) || {};
    let restrictions = parent.restrictions ? parent.get('restrictions')[0] : {};

    if (!restrictions) {
      return;
    }

    const restrictionList = without(restrictions.get('restriction'), restriction);

    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: restrictions,
        properties: {
          restriction: restrictionList
        }
      }
    });

    // remove 'execution:Restrictions' if there are no restrictions anymore
    if (!restrictionList.length) {
      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: parent,
          properties: {
            restrictions: undefined
          }
        }
      });
    }

    commandStack.execute('properties-panel.multi-command-executor', commands);
  };
}


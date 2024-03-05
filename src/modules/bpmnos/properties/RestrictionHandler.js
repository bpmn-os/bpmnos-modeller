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
  let parent = undefined;
  let restrictions = undefined;
  if ( is(businessObject, 'bpmn:SequenceFlow') ) {
    restrictions = getCustomItem( element, 'bpmnos:Restrictions' ) || {};
  }
  else {
    parent = getCustomItem( element, 'bpmnos:Status' ) || {};
    restrictions = parent.restrictions ? parent.get('restrictions')[0] : {};
  }

  const items = ( restrictions.restriction || []).map((restriction, index) => {
    const id = element.id + '-restriction-' + index;
    return {
      id,
      label: restriction.get('parameter').length ? restriction.get('parameter')[0].value : restriction.get('id'),
      entries: RestrictionEntries({
        idPrefix: id,
        element,
        restriction
      }),
      autoFocusEntry: id + '-expression',
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
//console.log(element);
    const businessObject = element.businessObject;

    let parent = undefined;
    let restrictions = undefined;
    if ( element.type == 'bpmn:SequenceFlow' ) {
      restrictions = ensureCustomItem( bpmnFactory, commandStack, element, 'bpmnos:Restrictions' );
//console.log(businessObject, element, restrictions);
    }
    else {
      parent = ensureCustomItem(bpmnFactory, commandStack, element, 'bpmnos:Status'); 
      restrictions = parent.restrictions ? parent.get('restrictions')[0] : undefined;
      if ( !restrictions ) {
        // create 'bpmnos:Restrictions'
        restrictions = createElement('bpmnos:Restrictions', {}, parent, bpmnFactory);
        commandStack.execute('element.updateModdleProperties', {
            element,
            moddleElement: parent,
            properties: {
              restrictions: [ ...parent.get('restrictions'), restrictions ]
            }
        });
      }
    }

    // create 'bpmnos:Restriction'
    const restriction = createElement('bpmnos:Restriction', { id: nextId('Restriction_') }, restrictions, bpmnFactory);

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: restrictions,
      properties: {
        restriction: [ ...restrictions.get('restriction'), restriction ]
      }
    });

    // create 'bpmnos:Parameter'
    const parameter = createElement('bpmnos:Parameter', { name: 'linear' }, restriction, bpmnFactory);

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: restriction,
      properties: {
        parameter: [ parameter ]
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

    let parent = undefined;
    let restrictions = undefined;
    if ( is(businessObject, 'bpmn:SequenceFlow') ) {
      restrictions = getCustomItem( element, 'bpmnos:Restrictions' ) || {};
    }
    else {
      parent = getCustomItem( element, 'bpmnos:Status' ) || {};
      restrictions = parent.restrictions ? parent.get('restrictions')[0] : {};
    }

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

    if (!restrictionList.length) {
      if ( is(businessObject, 'bpmn:SequenceFlow') ) {
        const extensionElements = businessObject.get('extensionElements');
        commands.push({
          cmd: 'element.updateModdleProperties',
          context: {
            element,
            moddleElement: extensionElements,
            properties: {
              values: without(extensionElements.values, restrictions)
            }
          }
        });
      }
      else {
      // remove 'bpmnos:Restrictions' from parent if there are no restrictions anymore
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
    }

    commandStack.execute('properties-panel.multi-command-executor', commands);
  };
}


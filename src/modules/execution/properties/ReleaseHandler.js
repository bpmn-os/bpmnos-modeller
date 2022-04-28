import {
  getBusinessObject,
  is
} from 'bpmn-js/lib/util/ModelUtil';

import ReleaseEntries from './ReleaseEntries';

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
export function releaseHandler({ element, injector }) {
  let businessObject = getBusinessObject(element);

  // do not offer for empty pools
  if (!businessObject) {
    return;
  }

  if ( !is(element, 'bpmn:Activity') || getBusinessObject(element).type != "Release") {
    return;
  }

  const bpmnFactory = injector.get('bpmnFactory'),
        commandStack = injector.get('commandStack');

  const allocations = getCustomItem( element, 'execution:Allocations' ) || {};

  const items = ( allocations.release || []).map((release, index) => {
    const id = element.id + '-release-' + index;

    return {
      id,
      label: release.get('request') || release.get('id'),
      entries: ReleaseEntries({
        idPrefix: id,
        element,
        release
      }),
      autoFocusEntry: id + '-id',
      remove: removeFactory({ commandStack, element, release })
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

    // create 'execution:Release'
    let release = createElement('execution:Release', { id: nextId('Release_') }, allocations, bpmnFactory);

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: allocations,
      properties: {
        release: [ ...allocations.get('release'), release ]
      }
    });
  };
}

// REMOVE FACTORY //
function removeFactory({ commandStack, element, release }) {
  return function(event) {
    event.stopPropagation();

    const commands = [];

    const businessObject = getBusinessObject(element);

    let allocations = getCustomItem(element,'execution:Allocations');

    if (!allocations) {
      return;
    }

    const releases = without(allocations.get('release'), release);

    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: allocations,
        properties: {
          release: releases
        }
      }
    });

    // remove 'execution:Allocations' if there are no releases anymore
    if (!releases.length) {
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



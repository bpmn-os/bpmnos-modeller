import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import TableEntries from './TableEntries';

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


// Creates tables entry and returns { items, add }
export function tableHandler({ element, injector }) {
  let businessObject = getRelevantBusinessObject(element);

  // do not offer for empty pools
  if (!businessObject) {
    return;
  }

  if ( !is(businessObject, 'bpmn:DataStoreReference') ) {
    return;
  }

  const bpmnFactory = injector.get('bpmnFactory'),
        commandStack = injector.get('commandStack');

  let tables  = undefined;
  tables = getCustomItem( element, 'bpmnos:Tables' ) || {};
  
  const items = ( tables.table || []).map((table, index) => {
    const id = element.id + '-table-' + index;

    return {
      id,
      label: table.get('name') ? table.get('name') + "(...)" : table.get('id'),
      entries: TableEntries({
        idPrefix: id,
        element,
        table
      }),
      autoFocusEntry: id + '-name',
      remove: removeFactory({ commandStack, element, table })
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

    let tables  = ensureCustomItem(bpmnFactory, commandStack, element, 'bpmnos:Tables'); 

    // create 'bpmnos:Table'
    const table = createElement('bpmnos:Table', { id: nextId('Table_') }, tables, bpmnFactory);

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: tables,
      properties: {
        table: [ ...tables.get('table'), table ]
      }
    });
  };
}

// REMOVE FACTORY //
function removeFactory({ commandStack, element, table }) {
  return function(event) {
    event.stopPropagation();

    const commands = [];

    const businessObject = getRelevantBusinessObject(element);

    let tables  = getCustomItem( element, 'bpmnos:Tables' ) || {};

    const tableList = without(tables.get('table'), table);

    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: tables,
        properties: {
          table: tableList
        }
      }
    });

    // remove 'bpmnos:Tables' if there are no operators anymore
    if (!tableList.length) {
      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: businessObject.get('extensionElements'),
          properties: {
            values: []
          }
        }
      });
    }
    commandStack.execute('properties-panel.multi-command-executor', commands);
  };
}


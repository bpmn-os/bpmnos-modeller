import { Group, ListGroup } from '@bpmn-io/properties-panel';

import {
  ProcessProps,
  IdProps,
  NameProps,
  DocumentationProps,
} from './properties/bpmn/';

import { ExecutableProps } from './properties/ExecutableProps';
import { statusHandler } from './properties/StatusHandler';
import { restrictionHandler } from './properties/RestrictionHandler';
import { operatorHandler } from './properties/OperatorHandler';
import { messageHandler } from './properties/MessageHandler';
import { timerHandler } from './properties/TimerHandler';
import { requestHandler } from './properties/RequestHandler';
import { releaseHandler } from './properties/ReleaseHandler';

const LOW_PRIORITY = 500;

const EXECUTION_GROUPS = [
{ label: 'Status', id: 'status', component: ListGroup, handler: statusHandler},
{ label: 'Restrictions', id: 'restrictions', component: ListGroup, handler: restrictionHandler},
{ label: 'Operators', id: 'operators', component: ListGroup, handler: operatorHandler},
{ label: 'Message', id: 'message', handler: messageHandler},
{ label: 'Timer', id: 'attribute', component: Group, handler: timerHandler},
{ label: 'Requests', id: 'requests', component: ListGroup, handler: requestHandler},
{ label: 'Releases', id: 'releases', component: ListGroup, handler: releaseHandler}
];

export default class ExecutionPropertiesProvider {

  constructor(propertiesPanel, injector) {
    propertiesPanel.registerProvider(LOW_PRIORITY, this);

    this._injector = injector;
  }

  getGroups(element) {
    return (groups) => {
      groups.push(GeneralGroup(element));

      EXECUTION_GROUPS.forEach( group => addGroup( group, groups, element, this._injector ) );

      return groups;
    };
  }
}

ExecutionPropertiesProvider.$inject = [ 'propertiesPanel', 'injector' ];

function addGroup({ label, id, handler, component }, groups, element, injector) {
//console.log(component);
  let group = {}
  if ( component == ListGroup ) {
    group = {
      label,
      id,
      component,
      ...handler({ element, injector })
    };
    if ( group.items ) {
      groups.push(group);
    }
  }
  else {
    const group = {
      label,
      id,
      component: Group,
      entries: [
        ...handler({ element, injector })
      ]
    };
    if (group.entries.length) {
      groups.push(group);
    }
  }
}

// from BpmnPropertiesProvider.js

function GeneralGroup(element) {

  const entries = [
    ...NameProps({ element }),
    ...IdProps({ element }),
    ...ProcessProps({ element }),
    ...ExecutableProps({ element }),
    ...DocumentationProps({ element })
  ];

  return {
    id: 'general',
    label: 'General',
    entries,
    component: Group
  };

}



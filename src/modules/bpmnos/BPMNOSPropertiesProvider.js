import { Group, ListGroup } from '@bpmn-io/properties-panel';

import {
  ProcessProps,
  IdProps,
  NameProps,
  DocumentationProps
} from './properties/bpmn/';


import { ExecutableProps } from './properties/ExecutableProps';
import { SequentialPerformerProps } from './properties/SequentialPerformerProps';
import { AdHocOrderingProps } from './properties/AdHocOrderingProps';
import { loopHandler } from './properties/LoopHandler';
import { attributeHandler } from './properties/AttributeHandler';
import { decisionHandler } from './properties/DecisionHandler';
import { restrictionHandler } from './properties/RestrictionHandler';
import { operatorHandler } from './properties/OperatorHandler';
import { multiMessageHandler } from './properties/MultiMessageHandler';
import { messageHandler } from './properties/MessageHandler';
import { timerHandler } from './properties/TimerHandler';
import { allocationHandler } from './properties/AllocationHandler';
import { guidanceHandler } from './properties/GuidanceHandler';

const LOW_PRIORITY = 500;

const EXECUTION_GROUPS = [
{ label: 'Loop parameters', id: 'loop', component: ListGroup, handler: loopHandler},
{ label: 'Attributes', id: 'attributes', component: ListGroup, handler: attributeHandler},
{ label: 'Decisions', id: 'decisions', component: ListGroup, handler: decisionHandler},
{ label: 'Restrictions', id: 'restrictions', component: ListGroup, handler: restrictionHandler},
{ label: 'Operators', id: 'operators', component: ListGroup, handler: operatorHandler},
{ label: 'Messages', id: 'message', component: ListGroup, handler: multiMessageHandler},
{ label: 'Message', id: 'message', handler: messageHandler},
{ label: 'Timer', id: 'attribute', component: Group, handler: timerHandler},
{ label: 'Allocations', id: 'allocations', component: ListGroup, handler: allocationHandler},
{ label: 'Guidance', id: 'guidance', component: ListGroup, handler: guidanceHandler}
];

export default class BPMNOSPropertiesProvider {

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

BPMNOSPropertiesProvider.$inject = [ 'propertiesPanel', 'injector' ];

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
    ...SequentialPerformerProps({ element }),
    ...AdHocOrderingProps({ element }),
    ...DocumentationProps({ element })
  ];

  return {
    id: 'general',
    label: 'General',
    entries,
    component: Group
  };

}

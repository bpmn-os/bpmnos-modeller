import { createResourceActivity, createRequestActivity, createReleaseActivity } from './ResourceElements.js';

import {
  is,
  isAny
} from 'bpmn-js/lib/util/ModelUtil';

export default class ResourceContextPad {
  constructor(config, contextPad, create, elementFactory, bpmnFactory, injector, translate) {
    this.create = create;
    this.elementFactory = elementFactory;
    this.bpmnFactory = bpmnFactory;
    this.translate = translate;

    if (config.autoPlace !== false) {
      this.autoPlace = injector.get('autoPlace', false);
    }

    contextPad.registerProvider(this);
  }

  getContextPadEntries(element) {
    if ( !is(element,"bpmn:FlowNode") || element.type == 'label' || is(element,"bpmn:EndEvent") ) {
      return;
    }
    if ( is(element,"bpmn:BoundaryEvent") &&
      element.businessObject &&
      element.businessObject.eventDefinitions &&
      element.businessObject.eventDefinitions.some(definition => {
        return definition.$type === 'bpmn:CompensateEventDefinition';
      })
    ) {
      return;
    }

    if ( is(element,"bpmn:SubProcess") &&
      element.businessObject &&
      element.businessObject.triggeredByEvent
    ) {
      return;
    }

    const {
      autoPlace,
      create,
      elementFactory,
      bpmnFactory,
      translate
    } = this;


    return {
      'append.resource': {
        group: 'model',
        className: 'bpmn-icon-resource',
        title: translate('Append Resource'),
        action: {
          click: appendResource,
          dragstart: appendResource
        }
      },
      'append.request': {
        group: 'model',
        className: 'bpmn-icon-request',
        title: translate('Append Request'),
        action: {
          click: appendRequest,
          dragstart: appendRequest
        }
      },
      'append.release': {
        group: 'model',
        className: 'bpmn-icon-release',
        title: translate('Append Release'),
        action: {
          click: appendRelease,
          dragstart: appendRelease
        }
      }
    };

    function appendResource(event) {
      const shape = createResourceActivity(bpmnFactory, elementFactory);
      if ( event.type != 'dragstart' && autoPlace ) {
        autoPlace.append(element, shape);
      } 
      else {
        create.start(event, shape, element);
      }
    }

    function appendRequest(event) {
      const shape = createRequestActivity(bpmnFactory, elementFactory);
      if ( event.type != 'dragstart' && autoPlace ) {
        autoPlace.append(element, shape);
      }
      else {
        create.start(event, shape, element);
      }
    }

    function appendRelease(event) {
      const shape = createReleaseActivity(bpmnFactory, elementFactory);
      if ( event.type != 'dragstart' && autoPlace ) {
        autoPlace.append(element, shape);
      }
      else {
        create.start(event, shape, element);
      }
    }

  }
}

ResourceContextPad.$inject = [
  'config',
  'contextPad',
  'create',
  'elementFactory',
  'bpmnFactory',
  'injector',
  'translate'
];

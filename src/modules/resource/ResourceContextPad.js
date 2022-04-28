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
    if ( !is(element,"bpmn:FlowNode") ) {
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
      'append.dummy': {
        group: 'model',
        action: {
          click: function() {},
          dragstart: function() {}
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
      },
      'append.resource': {
        group: 'model',
        className: 'bpmn-icon-resource',
        title: translate('Append Resource'),
        action: {
          click: appendResource,
          dragstart: appendResource
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

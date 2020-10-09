import {
  assign
} from 'min-dash';

/**
 * A palette provider for BPMN 2.0 elements.
 */
export default function PaletteProvider(
    palette, create, elementFactory,
    spaceTool, lassoTool, handTool,
    globalConnect, translate, bpmnFactory) {

  this._palette = palette;
  this._create = create;
  this._elementFactory = elementFactory;
  this._spaceTool = spaceTool;
  this._lassoTool = lassoTool;
  this._handTool = handTool;
  this._globalConnect = globalConnect;
  this._translate = translate;
  this._bpmnFactory = bpmnFactory;

  palette.registerProvider(this);
}

PaletteProvider.$inject = [
  'palette',
  'create',
  'elementFactory',
  'spaceTool',
  'lassoTool',
  'handTool',
  'globalConnect',
  'translate',
  'bpmnFactory'
];


PaletteProvider.prototype.getPaletteEntries = function(element) {
  var actions = {},
      create = this._create,
      elementFactory = this._elementFactory,
      spaceTool = this._spaceTool,
      lassoTool = this._lassoTool,
      handTool = this._handTool,
      globalConnect = this._globalConnect,
      translate = this._translate,
      bpmnFactory = this._bpmnFactory;

  function createAction(type, group, className, title, options) {

    function createListener(event) {
      var shape = elementFactory.createShape(assign({ type: type }, options));

      if (options) {
        shape.businessObject.di.isExpanded = options.isExpanded;
      }

      create.start(event, shape);
    }

    var shortType = type.replace(/^bpmn:/, '');

    return {
      group: group,
      className: className,
      title: title || translate('Create {type}', { type: shortType }),
      action: {
        dragstart: createListener,
        click: createListener
      }
    };
  }

  function createResource(event) {
    var shape = createResourceShape(bpmnFactory, elementFactory);

    create.start(event, shape);
  }
  function createRequest(event) {
    var shape = createRequestShape(bpmnFactory, elementFactory);

    create.start(event, shape);
  }
  function createRelease(event) {
    var shape = createReleaseShape(bpmnFactory, elementFactory);

    create.start(event, shape);
  }

  function createParticipant(event, collapsed) {
    create.start(event, elementFactory.createParticipantShape(collapsed));
  }

  assign(actions, {
    'hand-tool': {
      group: 'tools',
      className: 'bpmn-icon-hand-tool',
      title: translate('Activate the hand tool'),
      action: {
        click: function(event) {
          handTool.activateHand(event);
        }
      }
    },
    'lasso-tool': {
      group: 'tools',
      className: 'bpmn-icon-lasso-tool',
      title: translate('Activate the lasso tool'),
      action: {
        click: function(event) {
          lassoTool.activateSelection(event);
        }
      }
    },
    'space-tool': {
      group: 'tools',
      className: 'bpmn-icon-space-tool',
      title: translate('Activate the create/remove space tool'),
      action: {
        click: function(event) {
          spaceTool.activateSelection(event);
        }
      }
    },
    'global-connect-tool': {
      group: 'tools',
      className: 'bpmn-icon-connection-multi',
      title: translate('Activate the global connect tool'),
      action: {
        click: function(event) {
          globalConnect.toggle(event);
        }
      }
    },
    'tool-separator': {
      group: 'tools',
      separator: true
    },
    'create.start-event': createAction(
      'bpmn:StartEvent', 'event', 'bpmn-icon-start-event-none'
    ),
    'create.intermediate-event': createAction(
      'bpmn:IntermediateThrowEvent', 'event', 'bpmn-icon-intermediate-event-none',
      translate('Create Intermediate/Boundary Event')
    ),
    'create.end-event': createAction(
      'bpmn:EndEvent', 'event', 'bpmn-icon-end-event-none'
    ),
    'create.exclusive-gateway': createAction(
      'bpmn:ExclusiveGateway', 'gateway', 'bpmn-icon-gateway-none',
      translate('Create Gateway')
    ),
    'create.task': createAction(
      'bpmn:Task', 'activity', 'bpmn-icon-task'
    ),
    'create.subprocess-expanded': createAction(
      'bpmn:SubProcess', 'activity', 'bpmn-icon-subprocess-expanded',
      translate('Create expanded SubProcess'),
      { isExpanded: true }
    ),
    'create.request': {
      group: 'activity',
      className: 'bpmn-icon-request',
      title: translate('Create Request'),
      action: {
        dragstart: createRequest,
        click: createRequest
      }
    },
    'create.release': {
      group: 'activity',
      className: 'bpmn-icon-release',
      title: translate('Create Release'),
      action: {
        dragstart: createRelease,
        click: createRelease
      }
    },
    'create.resource': {
      group: 'activity',
      className: 'bpmn-icon-resource',
      title: translate('Create Resource'),
      action: {
        dragstart: createResource,
        click: createResource
      }
    },
    'create.data-object': createAction(
      'bpmn:DataObjectReference', 'data-object', 'bpmn-icon-data-object'
    ),
    'create.data-store': createAction(
      'bpmn:DataStoreReference', 'data-store', 'bpmn-icon-data-store'
    ),
    'create.participant-expanded': {
      group: 'collaboration',
      className: 'bpmn-icon-participant',
      title: translate('Create Pool/Participant'),
      action: {
        dragstart: createParticipant,
        click: createParticipant
      }
    }
  });

  return actions;
};

function createResourceShape(bpmnFactory, elementFactory) {
  var businessObject = bpmnFactory.create('bpmn:Task');

  businessObject.type = 'Resource';
  var element = elementFactory.createShape({ type: 'bpmn:Task', businessObject: businessObject });
  element.height /= 2;
  return element;
}

function createRequestShape(bpmnFactory, elementFactory) {
  var businessObject = bpmnFactory.create('bpmn:Task');

  businessObject.type = 'Request';
  var element = elementFactory.createShape({ type: 'bpmn:Task', businessObject: businessObject });
  element.height /= 2;
  return element;
}

function createReleaseShape(bpmnFactory, elementFactory) {
  var businessObject = bpmnFactory.create('bpmn:Task');

  businessObject.type = 'Release';
  var element = elementFactory.createShape({ type: 'bpmn:Task', businessObject: businessObject });
  element.height /= 2;
  return element;
}

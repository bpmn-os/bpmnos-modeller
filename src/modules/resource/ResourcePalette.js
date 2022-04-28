import { createResourceActivity, createRequestActivity, createReleaseActivity } from './ResourceElements.js';

export default class ResourcePalette {
  constructor(create, elementFactory, bpmnFactory, palette, translate) {
    this.create = create;
    this.elementFactory = elementFactory;
    this.bpmnFactory = bpmnFactory;
    this.translate = translate;
    palette.registerProvider(this);
  }

  getPaletteEntries(element) {
    const {
      create,
      elementFactory,
      bpmnFactory,
      translate
    } = this;

    return {
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
      } 
    }

    function createResource(event) {
      const shape = createResourceActivity(bpmnFactory, elementFactory);

      create.start(event, shape);
    }
    function createRequest(event) {
      const shape = createRequestActivity(bpmnFactory, elementFactory);

      create.start(event, shape);
    }
    function createRelease(event) {
      const shape = createReleaseActivity(bpmnFactory, elementFactory);

      create.start(event, shape);
    }

  }
}

ResourcePalette.$inject = [
  'create',
  'elementFactory',
  'bpmnFactory',
  'palette',
  'translate'
];

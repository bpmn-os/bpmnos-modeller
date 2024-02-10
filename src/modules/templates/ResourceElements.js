export function createResourceActivity(bpmnFactory, elementFactory) {
  var businessObject = bpmnFactory.create('bpmn:SubProcess');

  businessObject.type = 'Resource';
  var element = elementFactory.createShape({ type: 'bpmn:SubProcess', businessObject: businessObject });
  element.height /= 2;
  
  return element;
}

export function createRequestActivity(bpmnFactory, elementFactory) {
  var businessObject = bpmnFactory.create('bpmn:SubProcess');

  businessObject.type = 'Request';
  var element = elementFactory.createShape({ type: 'bpmn:SubProcess', businessObject: businessObject });
  element.height /= 2;
  return element;
}

export function createReleaseActivity(bpmnFactory, elementFactory) {
  var businessObject = bpmnFactory.create('bpmn:SubProcess');

  businessObject.type = 'Release';
  var element = elementFactory.createShape({ type: 'bpmn:SubProcess', businessObject: businessObject });
  element.height /= 2;
  return element;
}

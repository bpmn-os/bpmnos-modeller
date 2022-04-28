export function createResourceActivity(bpmnFactory, elementFactory) {
  var businessObject = bpmnFactory.create('bpmn:SubProcess');

  businessObject.id = 'Resource' + businessObject.id;
  businessObject.type = 'Resource';
  var element = elementFactory.createShape({ type: 'bpmn:SubProcess', businessObject: businessObject });
  element.height /= 2;
  
  return element;
}

export function createRequestActivity(bpmnFactory, elementFactory) {
  var businessObject = bpmnFactory.create('bpmn:Task');

  businessObject.id = 'Request' + businessObject.id;
  businessObject.type = 'Request';
  var element = elementFactory.createShape({ type: 'bpmn:Task', businessObject: businessObject });
  element.height /= 2;
  return element;
}

export function createReleaseActivity(bpmnFactory, elementFactory) {
  var businessObject = bpmnFactory.create('bpmn:Task');

  businessObject.id = 'Release' + businessObject.id;
  businessObject.type = 'Release';
  var element = elementFactory.createShape({ type: 'bpmn:Task', businessObject: businessObject });
  element.height /= 2;
  return element;
}

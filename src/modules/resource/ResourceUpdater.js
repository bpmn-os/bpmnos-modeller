import inherits from 'inherits';

import { is } from 'bpmn-js/lib/util/ModelUtil';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

function ifNewResourceActivity(fn) {
  return function(event) {
    var context = event.context,
        element = context.shape;
    if (is(element, 'bpmn:SubProcess') && element.businessObject.type == 'Resource') {
      fn(event);
    }
  };
}

/**
 * A handler responsible for creating children to a resource subprocess when this is created
 */
export default function ResourceUpdater(eventBus, modeling, elementFactory, elementRegistry) {

  CommandInterceptor.call(this, eventBus);

  function createResourceChildren(evt) {
    var context = evt.context,
	element = context.shape,
        businessObject = element.businessObject;

    const parent = elementRegistry.get(businessObject.id + '_plane');

    const startEvent = elementFactory.createShape({
      type: 'bpmn:StartEvent'  
    });
    const defaultSubprocess = elementFactory.createShape({
      type: 'bpmn:SubProcess'
    });        
    defaultSubprocess.businessObject.name = 'Default';

    const endEvent = elementFactory.createShape({
      type: 'bpmn:EndEvent'  
    });

    modeling.createShape(startEvent, {x:355, y:150}, parent);
    modeling.appendShape(startEvent, defaultSubprocess, {x:475, y:150}, parent)
    modeling.appendShape(defaultSubprocess, endEvent, {x:595, y:150}, parent)

    const allocationEventSubprocess = elementFactory.createShape({
      type: 'bpmn:SubProcess',
      isExpanded: true
    });  
    allocationEventSubprocess.businessObject.name = 'Allocation';
    allocationEventSubprocess.businessObject.triggeredByEvent = 'true';
    const requestMessage = elementFactory.createShape({
      type: 'bpmn:StartEvent',
      eventDefinitionType: 'bpmn:MessageEventDefinition',
      isInterrupting: false
    });
    requestMessage.businessObject.name = 'Request message';

    const prepareSubprocess = elementFactory.createShape({
      type: 'bpmn:SubProcess'
    });        
    prepareSubprocess.businessObject.name = 'Prepare';

    const readyMessage = elementFactory.createShape({
      type: 'bpmn:IntermediateThrowEvent',
      eventDefinitionType: 'bpmn:MessageEventDefinition',
    });
    readyMessage.businessObject.name = 'Ready message';


    const serviceSubprocess = elementFactory.createShape({
      type: 'bpmn:SubProcess'
    });        
    serviceSubprocess.businessObject.name = 'Service';

    const finishSubprocess = elementFactory.createShape({
      type: 'bpmn:SubProcess'
    });        
    finishSubprocess.businessObject.name = 'Finish';
    const allocationEndEvent = elementFactory.createShape({
      type: 'bpmn:EndEvent'  
    });

    modeling.createShape(allocationEventSubprocess, {x:100, y:300, width:750, height:100}, parent);

    modeling.createShape(requestMessage, {x:160, y:300}, allocationEventSubprocess);
    modeling.appendShape(requestMessage, prepareSubprocess, {x:280, y:300}, allocationEventSubprocess);
    modeling.appendShape(prepareSubprocess, readyMessage, {x:400, y:300}, allocationEventSubprocess);
    modeling.appendShape(readyMessage, serviceSubprocess, {x:520, y:300}, allocationEventSubprocess);
    modeling.appendShape(serviceSubprocess, finishSubprocess, {x:670, y:300}, allocationEventSubprocess);
    modeling.appendShape(finishSubprocess, allocationEndEvent, {x:790, y:300}, allocationEventSubprocess);

    // create start events for subprocesses
    [ defaultSubprocess, prepareSubprocess, serviceSubprocess, finishSubprocess ].forEach( subprocess => addStartEvent( subprocess, elementRegistry, elementFactory, modeling ) );

  }
  this.postExecute([
    'shape.create'
  ], ifNewResourceActivity(createResourceChildren));

}

function addStartEvent( subprocess, elementRegistry, elementFactory, modeling ) {
    const parent = elementRegistry.get(subprocess.businessObject.id + '_plane');
    const startEvent = elementFactory.createShape({
      type: 'bpmn:StartEvent'  
    });
    modeling.createShape(startEvent, {x:200, y:200}, parent);
}

inherits(ResourceUpdater, CommandInterceptor);


ResourceUpdater.$inject = [ 'eventBus', 'modeling', 'elementFactory', 'elementRegistry' ];

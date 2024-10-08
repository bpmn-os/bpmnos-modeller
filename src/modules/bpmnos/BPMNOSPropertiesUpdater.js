import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

export default function BPMNOSPropertiesUpdater(eventBus,commandStack) {

  eventBus.on('element.changed', function(event) {
    const element = event.element;
    if ( is(element,'bpmn:Event') ) {
      const eventDefinitions = element.businessObject.eventDefinitions;
      if ( !eventDefinitions || !eventDefinitions.find(definition => definition.$type == 'bpmn:MessageEventDefinition') ) {
        removeExtensionElements(element,'bpmnos:Message',commandStack);
      }
      if ( !eventDefinitions || !eventDefinitions.find(definition => definition.$type == 'bpmn:TimerEventDefinition') ) {
        removeExtensionElements(element,'bpmnos:Parameter',commandStack);
      }
    }
  });

}

BPMNOSPropertiesUpdater.$inject = [ 'eventBus', 'commandStack' ];

// helper

function removeExtensionElements(element,type,commandStack) {
  const extensionElements = element.businessObject.get('extensionElements');
  if ( extensionElements && extensionElements.values.find(value => value.$type == type) ) {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: element.businessObject,
      properties: { extensionElements: undefined }
    });
  } 
}


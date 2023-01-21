import {
  assign
} from 'min-dash';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';


/**
 * Provide external labels for custom elements.
 */
export default function ResourceLabelProvider(eventBus, modeling, textRenderer, elementRegistry) {

  eventBus.on("commandStack.shape.create.preExecute", function (event) {
    var context = event.context,
        element = context.shape;
    if ( is(element, 'bpmn:Activity') && 
         ( element.businessObject.type == 'Resource' 
           || element.businessObject.type == 'Request' 
           || element.businessObject.type == 'Release' 
         ) && element.type == 'label' && element.businessObject
       ) {
      // prevent copying of external label
      element.oldBusinessObject = element.businessObject;
      element.businessObject = undefined;
      return false;
    }
  });

  eventBus.on('commandStack.shape.create.postExecute', function(event) {
    var context = event.context,
        element = context.shape;
    if ( element.type == 'label' && !element.businessObject &&
         ( element.oldBusinessObject.type == 'Resource' 
           || element.oldBusinessObject.type == 'Request' 
           || element.oldBusinessObject.type == 'Release' 
         )
       ) {
      // remove and re-create external label
      const businessObject = element.oldBusinessObject;
      modeling.removeElements([ element ]);

      element = elementRegistry.get(businessObject.id);
      element.label = modeling.createLabel(element, 
        { x: element.x + element.width/2, 
          y: element.y + element.height + 16
        }, {
          id: element.businessObject.id + '_label',
          businessObject: element.businessObject
        }
      );
      if ( element.name ) {
        modeling.updateLabel(element.label, element.name);
      }
    }
    else if ( is(element, 'bpmn:Activity') && 
         ( element.businessObject.type == 'Resource' 
           || element.businessObject.type == 'Request' 
           || element.businessObject.type == 'Release' 
         ) && element.type != 'label' && !element.label 
       ) {
      // create external label
      modeling.createLabel(element, 
        { x: element.x + element.width/2, 
          y: element.y + element.height + 16
        }, {
          id: element.businessObject.id + '_label',
          businessObject: element.businessObject
        }
      );
    }
  });

  eventBus.on('commandStack.shape.delete.postExecute', function(event) {
    var context = event.context,
        element = context.shape;
    if ( is(element, 'bpmn:Activity') && 
         ( element.businessObject.type == 'Resource' 
           || element.businessObject.type == 'Request' 
           || element.businessObject.type == 'Release' 
         ) 
         && element.type == 'label') {
      element.businessObject.name = undefined;
    }
  });

  eventBus.on('element.dblclick', 99999, function(event) {
    var element = event.element;
    if ( is(element, 'bpmn:Activity') && 
         ( element.businessObject.type == 'Resource' 
           || element.businessObject.type == 'Request' 
           || element.businessObject.type == 'Release' 
         ) 
         && element.type != 'label' && !element.label ) {

      // create external label
      var bounds = { width: 90, height: 14 };
      if ( element.businessObject.name ) {
        bounds = textRenderer.getExternalLabelBounds({}, element.businessObject.name);
      }
      bounds.x = element.x + element.width/2 - bounds.width/2;
      bounds.y = element.y + element.height + 16 - bounds.height/2;

      element.di.label = { bounds };
      element.label = modeling.createLabel(element, bounds, {
          id: element.businessObject.id + '_label',
          businessObject: element.businessObject
        }
      );

      return false;
    }
  });

  eventBus.on('shape.added', function(event) {
    var element = event.element;
    if ( is(element, 'bpmn:Activity') && 
         ( element.businessObject.type == 'Resource' 
           || element.businessObject.type == 'Request' 
           || element.businessObject.type == 'Release' 
         ) 
         && element.type != 'label' && !element.label
         && element.di && element.di.label && element.di.label.bounds
       ) {
      // create external label
      modeling.createLabel(element, element.di.label.bounds, {
          id: element.businessObject.id + '_label',
          businessObject: element.businessObject,
        }
      );
    }
  });
}

ResourceLabelProvider.$inject = [
  'eventBus',
  'modeling',
  'textRenderer',
  'elementRegistry'
];



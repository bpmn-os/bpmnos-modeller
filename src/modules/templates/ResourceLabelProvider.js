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

  /********************************************************
  * When copying a custom element with external label,
  * the plane containing the label is created twice.
  * This can be prevented by the following event handlers.
  ********************************************************/
  eventBus.on('commandStack.shape.create.preExecute', function (event) {
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
      // remove (defunct) label and re-create external label
      const businessObject = element.oldBusinessObject;
      modeling.removeElements([ element ]);

      element = elementRegistry.get(businessObject.id);
      element.label = modeling.createLabel(element, 
        { x: element.x + element.width/2, 
          y: element.y + element.height + 16,
        }, {
          id: element.businessObject.id + '_label',
          businessObject: element.businessObject
        }
      );
      if ( element.name ) {
        modeling.updateLabel(element.label, element.name);
      }
    }
  });

  /********************************************************
  * When creating a custom element, an external label
  * is created by the following event handler.
  ********************************************************/
  eventBus.on('commandStack.shape.create.postExecute', function(event) {
    var context = event.context,
        element = context.shape;
    if ( is(element, 'bpmn:Activity') && 
         ( element.businessObject.type == 'Resource' 
           || element.businessObject.type == 'Request' 
           || element.businessObject.type == 'Release' 
         ) && element.type != 'label' && !element.label 
       ) {
      // create external label
      modeling.createLabel(element, 
        { x: element.x + element.width/2, 
          y: element.y + element.height + 16,
        }, {
          id: element.businessObject.id + '_label',
          businessObject: element.businessObject
        }
      );
    }
  });

  /********************************************************
  * When deleting the external label of a custom element, 
  * the name of the element is deleted by the following 
  * event handler.
  ********************************************************/
  eventBus.on('commandStack.shape.delete.postExecute', function(event) {
    var context = event.context,
        element = context.shape;
    if ( is(element, 'bpmn:Activity') && element.businessObject &&
         ( element.businessObject.type == 'Resource' 
           || element.businessObject.type == 'Request' 
           || element.businessObject.type == 'Release' 
         ) 
         && element.type == 'label') {
      element.businessObject.name = undefined;
    }
  });

  /********************************************************
  * When changing the name of a custom element without  
  * label, an external label is created by the following 
  * event handler.
  ********************************************************/

  eventBus.on('element.changed', 99999, function(event) {
    var element = event.element;
    if ( is(element, 'bpmn:Activity') && element.businessObject &&
         ( element.businessObject.type == 'Resource' 
           || element.businessObject.type == 'Request' 
           || element.businessObject.type == 'Release' 
         ) && element.type != 'label' && element.businessObject.name && !element.label
           && !element.id.endsWith('_plane') 
       ) {
      // create external label
      var bounds = { width: 90, height: 14 };
      if ( element.businessObject.name ) {
        bounds = textRenderer.getExternalLabelBounds({}, element.businessObject.name);
      }
      bounds.x = element.x + element.width/2 - bounds.width/2;
      bounds.y = element.y + element.height + 16 - bounds.height/2;

      if ( element.di && element.di.label ) delete element.di.label;
      modeling.createLabel(element, bounds, {
          id: element.businessObject.id + '_label',
          businessObject: element.businessObject
        }
      );
      return false;
    }
  });

  /********************************************************
  * When double clicking on a custom element without  
  * label, an external label is created by the following 
  * event handler.
  ********************************************************/
  eventBus.on('element.dblclick', 99999, function(event) {
    var element = event.element;
    if ( is(element, 'bpmn:Activity') && element.businessObject &&
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

      if ( element.di && element.di.label ) delete element.di.label;
      modeling.createLabel(element, bounds, {
          id: element.businessObject.id + '_label',
          businessObject: element.businessObject
        }
      );
    }
  });

  /********************************************************
  * When loading a diagram containing custom elements with  
  * label, the external label is created and linked to the
  * existing di by the following  event handler.
  ********************************************************/
  eventBus.on('shape.added', function(event) {
    var element = event.element;
    if ( is(element, 'bpmn:Activity') && element.businessObject &&
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
          di: element.di
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



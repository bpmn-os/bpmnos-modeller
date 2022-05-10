import inherits from 'inherits';

import { is } from 'bpmn-js/lib/util/ModelUtil';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

import subProcessTemplates from './SubProcessTemplates.bpmn';
import BpmnModeler from 'bpmn-js/lib/Modeler';

function ifNewResourceActivity(fn) {
  return function(event) {
    var context = event.context,
        element = context.shape;
    if ( event.command == 'shape.create' && is(element, 'bpmn:SubProcess') && 
         ( element.businessObject.type == 'Resource' || element.businessObject.type == 'Request' || element.businessObject.type == 'Release' )
       ) {
      fn(event);
    }
  };
}

let children = {};
function selectChildren(elementRegistry, id) {
  const elements = elementRegistry.getAll().filter(function(element) {
    // determine children to be copied 
    return element.parent && element.parent.id == id + '_plane';
  });
  return elements;
}

const subProcessModeler = new BpmnModeler();
subProcessModeler.importXML(subProcessTemplates).then( function() {
    const sourceClipboard = subProcessModeler.get('clipboard'),
          sourceCopyPaste = subProcessModeler.get('copyPaste'),
          sourceElementRegistry = subProcessModeler.get('elementRegistry');

    // copy resource template
    sourceCopyPaste.copy(selectChildren(sourceElementRegistry,'ResourceActivityTemplate'));
    // retrieve clipboard contents
    children['Resource'] = sourceClipboard.get();

    // copy request template
    sourceCopyPaste.copy(selectChildren(sourceElementRegistry,'RequestActivityTemplate'));
    // retrieve clipboard contents
    children['Request'] = sourceClipboard.get();

    // copy release template
    sourceCopyPaste.copy(selectChildren(sourceElementRegistry,'ReleaseActivityTemplate'));
    // retrieve clipboard contents
    children['Release'] = sourceClipboard.get();

});


/**
 * A handler responsible for creating children to a resource subprocess when this is created
 */
export default function ResourceUpdater(eventBus, modeling, elementFactory, elementRegistry) {

  CommandInterceptor.call(this, eventBus);

  function createChildren(evt) {
    const context = evt.context,
          element = context.shape,
          businessObject = element.businessObject;

    const targetClipboard = modeler.get('clipboard'),
          targetCopyPaste = modeler.get('copyPaste'),
          targetElementRegistry = modeler.get('elementRegistry');

    // put into clipboard
    targetClipboard.set(children[businessObject.type]);

//    const parent = targetElementRegistry.get(businessObject.id + '_plane');
// console.log(parent);

    // remember size of collapsed subprocess
    const x = element.x,
        y = element.y,
        height = element.height, 
        width = element.width;

    const pasteContext = {
        element,
//      element: parent, 
//      element: targetElementRegistry.get('Templates'),
      point: {x:100, y:100}
    };

    // paste tree
    targetCopyPaste.paste(pasteContext);

    modeling.resizeShape(element, { width, height, x, y } );

  }
  this.postExecute([
    'shape.create'
  ], ifNewResourceActivity(createChildren));

}

inherits(ResourceUpdater, CommandInterceptor);

ResourceUpdater.$inject = [ 'eventBus', 'modeling', 'elementFactory', 'elementRegistry' ];

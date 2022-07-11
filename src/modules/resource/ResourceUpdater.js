import inherits from 'inherits';

import { is } from 'bpmn-js/lib/util/ModelUtil';

import Ids from 'ids';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

import subProcessTemplates from './SubProcessTemplates.bpmn';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import ExecutionModdleDescriptor from '../../modules/execution/execution.json';

function ifNewResourceActivity(fn) {
  return function(event) {
    var context = event.context,
        element = context.shape;
    if ( event.command == 'shape.create'  && is(element, 'bpmn:SubProcess') && 
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

const subProcessModeler = new BpmnModeler({  
  moddleExtensions: {
    execution: ExecutionModdleDescriptor,
  }
});

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

function preventResize(evt) {
  evt.context.newBounds = { x: evt.context.shape.x, y: evt.context.shape.y, width: evt.context.shape.width, height: evt.context.shape.height };
}


function replaceIds(obj) {
  for (var key in obj) {
    if (obj[key] !== null && typeof obj[key] === "object") {
      // Recurse into children
      replaceIds(obj[key]);
    }
    else if ( key == "id" && obj[key].includes("_") ) {
      // Replace id of all elements including an underscore within the id
      const ids = new Ids([ 32,32,1 ]);
      obj[key] =  ids.nextPrefixed( obj[key].substring(0, obj[key].lastIndexOf('_') + 1) ); 
    }
  }
}


/**
 * A handler responsible for creating children to a resource subprocess when this is created
 */
export default function ResourceUpdater(eventBus, modeling, /*elementFactory,*/ elementRegistry, editorActions, contextPad, dragging, directEditing) {

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

    const planeElement = elementRegistry.getAll().find(function(el) {
      // determine plane element to paste children
      return el.id == element.id + '_plane';
    });
    const pasteContext = {
      element: planeElement,
      point: {x: 500, y: 200}
    };
    // paste tree
    targetCopyPaste.paste(pasteContext);
  }

  this.postExecute([
    'shape.create'
  ], ifNewResourceActivity(createChildren));


  eventBus.on('moddleCopy.canCopyProperty', function(context) {
    var property = context.property;
    if (is(property, 'bpmn:ExtensionElements')) {
      // create a copy of the extension elements in which all ids are replaced
      let copiedProperty = modeler.get('moddle').create('bpmn:ExtensionElements');
      copiedProperty.values = [...property.values];
      replaceIds(copiedProperty.values);

      return copiedProperty;
    }
  });

  let preventEditing = true;
  if ( preventEditing ) {
    /// Disable modeling within resource activities
    let modelingDisabled = false;

    eventBus.on("root.set", function(event) {
      const bo = event.element.businessObject;
      modelingDisabled = ( bo && ( bo.type == 'Resource' || bo.type == 'Request' || bo.type == 'Release' ) );
    });

    /// From:  bpmn-js-token-simulation/lib/features/disable-modeling/DisableModeling.js
    function intercept(obj, fnName, cb) {
      const fn = obj[fnName];
      obj[fnName] = function() {
        return cb.call(this, fn, arguments);
      };
    }

    function ignoreIfModelingDisabled(obj, fnName) {
      intercept(obj, fnName, function(fn, args) {
        if (modelingDisabled) {
          return;
        }

        return fn.apply(this, args);
      });
    }

    function throwIfModelingDisabled(obj, fnName) {
      intercept(obj, fnName, function(fn, args) {
        if (modelingDisabled) {
          throw new Error('model is read-only');
        }

        return fn.apply(this, args);
      });
    }

    ignoreIfModelingDisabled(contextPad, 'open');
    ignoreIfModelingDisabled(dragging, 'init');
    ignoreIfModelingDisabled(directEditing, 'activate');
    ignoreIfModelingDisabled(dragging, 'init');
    ignoreIfModelingDisabled(directEditing, 'activate');

    throwIfModelingDisabled(modeling, 'moveShape');
    throwIfModelingDisabled(modeling, 'updateAttachment');
    throwIfModelingDisabled(modeling, 'moveElements');
    throwIfModelingDisabled(modeling, 'moveConnection');
    throwIfModelingDisabled(modeling, 'layoutConnection');
    throwIfModelingDisabled(modeling, 'createConnection');
    throwIfModelingDisabled(modeling, 'createShape');
    throwIfModelingDisabled(modeling, 'createLabel');
    throwIfModelingDisabled(modeling, 'appendShape');
    throwIfModelingDisabled(modeling, 'removeElements');
    throwIfModelingDisabled(modeling, 'distributeElements');
    throwIfModelingDisabled(modeling, 'removeShape');
    throwIfModelingDisabled(modeling, 'removeConnection');
    throwIfModelingDisabled(modeling, 'replaceShape');
    throwIfModelingDisabled(modeling, 'pasteElements');
    throwIfModelingDisabled(modeling, 'alignElements');
    throwIfModelingDisabled(modeling, 'resizeShape');
    throwIfModelingDisabled(modeling, 'createSpace');
    throwIfModelingDisabled(modeling, 'updateWaypoints');
    throwIfModelingDisabled(modeling, 'reconnectStart');
    throwIfModelingDisabled(modeling, 'reconnectEnd');

    intercept(editorActions, 'trigger', function(fn, args) {
      const action = args[0];

      if (modelingDisabled && isAnyAction([
        'undo',
        'redo',
        'copy',
        'paste',
        'removeSelection',
        'spaceTool',
        'lassoTool',
        'globalConnectTool',
        'distributeElements',
        'alignElements',
        'directEditing',
      ], action)) {
        return;
      }

      return fn.apply(this, args);
    });
  }

  // helpers //////////

  function isAnyAction(actions, action) {
    return actions.indexOf(action) > -1;
  }
}

inherits(ResourceUpdater, CommandInterceptor);

ResourceUpdater.$inject = [ 'eventBus', 'modeling', /*'elementFactory',*/ 'elementRegistry', 'editorActions',  'contextPad', 'dragging', 'directEditing' ];

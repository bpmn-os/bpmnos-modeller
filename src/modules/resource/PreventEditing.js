import inherits from 'inherits';

import { is } from 'bpmn-js/lib/util/ModelUtil';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';


/**
 * Disable editing of resource, request, and release activities
 * Based on: bpmn-js-token-simulation/lib/features/disable-modeling/DisableModeling.js
 */
export default function PreventEditing(
    eventBus,
    contextPad,
    dragging,
    directEditing,
    editorActions,
    modeling,
    palette,
    paletteProvider) {
  const urlParams = new URLSearchParams(window.location.search);
  let preventEditing = !urlParams.has('unlocked');

  CommandInterceptor.call(this, eventBus);

  let modelingDisabled = false;

  if ( preventEditing ) {
    /// Disable modeling within custom activities
    eventBus.on("root.set", event => {
      const bo = event.element.businessObject;
      modelingDisabled = ( bo && ( bo.type == 'Resource' || bo.type == 'Request' || bo.type == 'Release' ) );
    });
  }

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

inherits(PreventEditing, CommandInterceptor);

PreventEditing.$inject = [
  'eventBus',
  'contextPad',
  'dragging',
  'directEditing',
  'editorActions',
  'modeling',
  'palette',
  'paletteProvider',
];

// helpers //////////

function isAnyAction(actions, action) {
  return actions.indexOf(action) > -1;
}

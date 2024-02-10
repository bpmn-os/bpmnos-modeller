import { is } from 'bpmn-js/lib/util/ModelUtil';

import Ids from 'ids';

function replaceExtensionElementIds(obj) {
  for (var key in obj) {
    if (obj[key] !== null && typeof obj[key] === "object") {
      // Recurse into children
      replaceExtensionElementIds(obj[key]);
    }
    else if ( key == "id" ) {
      if ( !obj[key].includes("_") ) {
        // Append underscore if necessary
        obj[key] = obj[key] + "_";
      }
      // Replace or add id of all elements
      const ids = new Ids([ 32,32,1 ]);
      obj[key] =  ids.nextPrefixed( obj[key].substring(0, obj[key].lastIndexOf('_') + 1) ); 
    }
  }
}

/**
 * A replace all ids within extension elements after copying
 */
export default function ReplaceIds(bpmnjs, eventBus) {
  eventBus.on('moddleCopy.canCopyProperty', function(context) {
    var property = context.property;
    if (is(property, 'bpmn:ExtensionElements')) {
      // create a copy of the extension elements in which all ids are replaced
      let copiedProperty = bpmnjs.get('moddle').create('bpmn:ExtensionElements');
      copiedProperty.values = [...property.values];
      replaceExtensionElementIds(copiedProperty.values);

      return copiedProperty;
    }
  });
}

ReplaceIds.$inject = [ 'bpmnjs', 'eventBus' ];

import inherits from 'inherits';

import { is } from 'bpmn-js/lib/util/ModelUtil';

import {
  replaceIds
} from '../execution/utils/CustomItemUtil';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

import BpmnModeler from 'bpmn-js/lib/Modeler';
import ResourceModdleDescriptor from '../../modules/resource/resource.json';
import ExecutionModdleDescriptor from '../../modules/execution/execution.json';
import copyAndPaste from 'bpmn-js-subprocess-importer/CopyAndPaste';
import releaseTemplate from './ReleaseTemplate.bpmn'; 

function ifNewReleaseActivity(fn) {
  return function(event) {
    var context = event.context,
        element = context.shape;
    if ( event.command == 'shape.create'
      && is(element, 'bpmn:SubProcess')
      && !element.children.length
      && element.businessObject.type == 'Release'
    ) {
      fn(element);
    }
  };
}


/**
 * A handler responsible for creating children of a release activity when this is created
 */
export default function ReleaseFactory(bpmnjs, elementRegistry, eventBus, modeling) {
  const sourceModeler = new BpmnModeler({  
    moddleExtensions: {
      resource: ResourceModdleDescriptor,
      execution: ExecutionModdleDescriptor,
    }
  });
  sourceModeler.importXML(releaseTemplate);
  const sourceElementRegistry = sourceModeler.get('elementRegistry');
  const targetElementRegistry = elementRegistry;

  const urlParams = new URLSearchParams(window.location.search);
  let preventEditing = !urlParams.has('unlocked');

  CommandInterceptor.call(this, eventBus);

  function populateSubProcess(element) {
    copyAndPaste(sourceModeler,sourceElementRegistry.get('ReleaseActivityTemplate'),bpmnjs,element );
    const planeElement = bpmnjs.get('elementRegistry').get(`${element.id}_plane`);

    if ( preventEditing ) {
      // color all copied elements
      var ids = []
      for (var i=0; i < planeElement.di.planeElement.length; i++) {
        ids.push(planeElement.di.planeElement[i].bpmnElement.id);
      }
      var elementsToColor = targetElementRegistry.getAll().filter( el => ids.find(id => id == el.id) );
      modeling.setColor(elementsToColor, {
        fill: '#F8F8F8'
      });
    }
  }

  this.postExecute([
    'shape.create'
  ], ifNewReleaseActivity(populateSubProcess));

  eventBus.on('moddleCopy.canCopyProperty', function(context) {
    var property = context.property;
    if (is(property, 'bpmn:ExtensionElements')) {
      // create a copy of the extension elements in which all ids are replaced
      let copiedProperty = bpmnjs.get('moddle').create('bpmn:ExtensionElements');
      copiedProperty.values = [...property.values];
      replaceIds(copiedProperty.values);

      return copiedProperty;
    }
  });
}

inherits(ReleaseFactory, CommandInterceptor);

ReleaseFactory.$inject = [ 'bpmnjs','elementRegistry', 'eventBus', 'modeling' ];

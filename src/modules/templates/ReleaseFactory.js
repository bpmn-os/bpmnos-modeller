import inherits from 'inherits';

import { is } from 'bpmn-js/lib/util/ModelUtil';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

import BpmnModeler from 'bpmn-js/lib/Modeler';
import BPMNOSModdleDescriptor from '../../modules/bpmnos/bpmnos.json';
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
      bpmnos: BPMNOSModdleDescriptor
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
}

inherits(ReleaseFactory, CommandInterceptor);

ReleaseFactory.$inject = [ 'bpmnjs','elementRegistry', 'eventBus', 'modeling' ];

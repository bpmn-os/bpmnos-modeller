import BpmnModeler from 'bpmn-js/lib/Modeler';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import { BpmnPropertiesPanelModule } from 'bpmn-js-properties-panel';

import TokenSimulationModule from 'bpmn-js-token-simulation';

import BPMNOSModdleDescriptor from './modules/bpmnos/bpmnos.json';
import BPMNOSPropertiesProviderModule from './modules/bpmnos/';
//import BPMNOSTemplatesModule from './modules/templates'; // Resource, request, release templates
import EventSubProcessPaletteModule from './modules/event-subprocess'; // "Create expanded event sub-process" palette entry

import sampleProcess from './newDiagram.bpmn';

import SubProcessImporterModule from 'bpmn-js-subprocess-importer';
import CollapseEventSubProcessModule from 'bpmn-js-collapse-event-subprocess';
import SequentialAdHocSubProcessModule from 'bpmn-js-sequential-adhoc-subprocesses';

import LintModule from 'bpmn-js-bpmnlint';
import getLintConfig from './modules/linting';
import createLintControls from './modules/linting/create-lint-controls';

import SidePanelModule from 'bpmn-js-side-panel';

var modelName = 'diagram';

var moddleExtensions = {
    bpmnos: BPMNOSModdleDescriptor
};

var modeler = new BpmnModeler({
  container: '#canvas',
  linting: {
    bpmnlint: getLintConfig()
  },
  sidePanel: {
    parent: '#side-panel',
    header: '<img src="BPMNOS.svg" style="width:120px;margin:10px 10px 6px 10px;"/>'
  },
  additionalModules: [
    BpmnPropertiesPanelModule,
    BPMNOSPropertiesProviderModule,
//    BPMNOSTemplatesModule,
    SidePanelModule,
    EventSubProcessPaletteModule,
    LintModule,
    TokenSimulationModule,
    SequentialAdHocSubProcessModule,
    SubProcessImporterModule,
    CollapseEventSubProcessModule
  ],
  moddleExtensions
});

var subProcessImporter = modeler.get('subProcessImporter');
if ( subProcessImporter ) {
  subProcessImporter.setModdleExtensions(moddleExtensions);
}

const sidePanel = modeler.get('sidePanel');
const issuesPane = sidePanel.addTab({ id: 'issues', label: 'Issues', priority: 0 });
createLintControls(modeler, issuesPane);

modeler.importXML(sampleProcess);

window.modeler = modeler;

var element;
var HIGH_PRIORITY = 100000;

modeler.on('element.contextmenu', HIGH_PRIORITY, function(event) {
  event.originalEvent.preventDefault();
  event.originalEvent.stopPropagation();

  return true;
});

function downloadXML(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/xml;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

var zoomIn = document.getElementById('js-zoom-in');
var zoomOut = document.getElementById('js-zoom-out');
var center = document.getElementById('js-center');

if (zoomIn) {
  zoomIn.addEventListener('click', function() {
    modeler.get('zoomScroll').stepZoom(1);
    return false;
  });
}
if (zoomOut) {
  zoomOut.addEventListener('click', function() {
    modeler.get('zoomScroll').stepZoom(-1);
    return false;
  });
}

if (center) {
  center.addEventListener('click', function() {
    modeler.get('canvas').zoom('fit-viewport', 'auto');
    return false;
  });
}


function show(content) {
  console.log(content);
  modeler.importXML(content);
}


var href = new URL(window.location.href);
var src = href.searchParams.get('src');
if (src) {
  console.log(src);
  loadBPMN(src);
}

function loadBPMN(URL) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      show(xhttp.responseText);
    }
    else {
      console.warn('Failed to get file. ReadyState: ' + xhttp.readyState + ', Status: ' + xhttp.status);
    }
  };
  xhttp.open('GET',URL,true);
  xhttp.send();
}

var uploadBPMN = document.getElementById('js-upload-bpmn');
if (uploadBPMN) {
  uploadBPMN.value = '';
  uploadBPMN.addEventListener('change', function(event) {
    var file = event.target.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
      show(reader.result);
    };
    reader.onerror = function(err) {
      console.log(err,err.loaded,err.loaded === 0,file);
    };

    reader.readAsText(event.target.files[0]);
    modelName = event.target.files[0].name.split('.')[0];
  });
}

var downloadBPMN = document.getElementById('js-download-bpmn');
var downloadSVG = document.getElementById('js-download-svg');

if (downloadBPMN) {
  downloadBPMN.addEventListener('click', function() {
    modeler.saveXML().then( function(model) {
      downloadXML(modelName + '.bpmn', model.xml);
      console.log(model.xml);
    } );
    return false;
  });
}
if (downloadSVG) {
  downloadSVG.addEventListener('click', function() {
    modeler.saveSVG({ format: true }).then( function(model) {
      downloadXML(modelName + '.svg', model.svg);
      console.log(model.svg);
    });
    return false;
  });
}


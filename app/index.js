import BpmnModeler from 'bpmn-js/lib/Modeler';

import propertiesPanelModule from 'bpmn-js-properties-panel';

//import bpmnProviderModule from 'bpmn-js-properties-panel/lib/provider/bpmn';

//import executionPropertiesProviderModule from './modules/camunda';
//import executionModdleDescriptor from './modules/camunda/camunda.json';

import executionPropertiesProviderModule from './modules/execution';
import executionModdleDescriptor from './modules/execution/execution.json';

import sampleProcess from '../resources/newDiagram.bpmn';

import resourcePackage from './modules/resource/resource.json';

import {
  ResourceContextPadProvider,
  ResourcePaletteProvider,
  ResourceRenderer
} from './modules/resource';


var modeler = new BpmnModeler({
  container: '#canvas',
  propertiesPanel: {
    parent: '#properties-panel'
  },
  additionalModules: [
    {
      __init__: [ 'contextPadProvider', 'renderer', 'paletteProvider', ],
      contextPadProvider: [ 'type', ResourceContextPadProvider ],
      renderer: [ 'type', ResourceRenderer ],
      paletteProvider: [ 'type', ResourcePaletteProvider ]
    },
   propertiesPanelModule,
   executionPropertiesProviderModule
  ],
  moddleExtensions: {
    resource: resourcePackage,
    execution: executionModdleDescriptor,
  }
});

modeler.importXML(sampleProcess);

window.modeler = modeler;

var element;
var HIGH_PRIORITY = 100000;

modeler.on('element.contextmenu', HIGH_PRIORITY, function(event) {
  element = event.element;

  var businessObject = getBusinessObject(element);

  if (!businessObject.type) {
    return;
  }

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
  });
}

var downloadBPMN = document.getElementById('js-download-bpmn');
var downloadSVG = document.getElementById('js-download-svg');

if (downloadBPMN) {
  downloadBPMN.addEventListener('click', function() {
    modeler.saveXML({ format: true }, function(err, xml) {
      downloadXML('diagram.bpmn', xml);
      console.log(xml);
    });
    return false;
  });
}
if (downloadSVG) {
  downloadSVG.addEventListener('click', function() {
    modeler.saveSVG({}, function(err, svg) {
      downloadXML('diagram.svg', svg);
      console.log(svg);
    });
    return false;
  });
}

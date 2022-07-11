import BpmnModeler from 'bpmn-js/lib/Modeler';


import { BpmnPropertiesPanelModule } from 'bpmn-js-properties-panel';

import TokenSimulationModule from 'bpmn-js-token-simulation';



import ExecutionPropertiesProviderModule from './modules/execution/';
import ExecutionModdleDescriptor from './modules/execution/execution.json';

import sampleProcess from './newDiagram.bpmn';

import ResourceModdleDescriptor from './modules/resource/resource.json';

import ResourceExtensionModule from './modules/resource';

var modelName = 'diagram';

var modeler = new BpmnModeler({
  container: '#canvas',
  propertiesPanel: {
    parent: '#properties-panel'
  },
  keyboard: { bindTo: document },
  additionalModules: [
   ResourceExtensionModule,
   BpmnPropertiesPanelModule,
   ExecutionPropertiesProviderModule,
   TokenSimulationModule
  ],
  moddleExtensions: {
    resource: ResourceModdleDescriptor,
    execution: ExecutionModdleDescriptor,
  }
});

modeler.importXML(sampleProcess);

window.modeler = modeler;

var element;
var HIGH_PRIORITY = 100000;

modeler.on('element.contextmenu', HIGH_PRIORITY, function(event) {
  element = event.element;

  var businessObject = getBusinessObject(element) || {};

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
    modeler.saveSVG({}, function(err, svg) {
      downloadXML(modelName + '.svg', svg);
      console.log(svg);
    });
    return false;
  });
}

// Resize properties panel
// A function is used for dragging and moving
function dragElement(element, direction)
{
    var   md; // remember mouse down info
    const first  = document.getElementById("leftbox");
    const second = document.getElementById("rightbox");

    element.onmousedown = onMouseDown;
    element.ontouchstart = onTouchStart;

    function onMouseDown(e)
    {
        //console.log("mouse down: " + e.clientX);
        md = {e,
              offsetLeft:  element.offsetLeft,
              offsetTop:   element.offsetTop,
              firstWidth:  first.offsetWidth,
              secondWidth: second.offsetWidth
             };

        document.onmousemove = onMouseMove;
        document.onmouseup = () => {
            //console.log("mouse up");
            document.onmousemove = document.onmouseup = null;
        }
    }

    function onMouseMove(e)
    {
        //console.log("mouse move: " + e.clientX);
        var delta = {x: e.clientX - md.e.clientX,
                     y: e.clientY - md.e.clientY};

        if (direction === "H" ) // Horizontal
        {
            // Prevent splitter to become moved out of visible area
            delta.x = Math.min(Math.max(delta.x, -md.firstWidth),
                       md.secondWidth);
		
            element.style.left = md.offsetLeft + delta.x + "px";
            first.style.width = (md.firstWidth + delta.x) + "px";
            second.style.width = (md.secondWidth - delta.x) + "px";
        }
    }

    function onTouchStart(e)
    {
        //console.log("touch start: " + e.clientX);
        md = {e,
              offsetLeft:  element.offsetLeft,
              offsetTop:   element.offsetTop,
              firstWidth:  first.offsetWidth,
              secondWidth: second.offsetWidth
             };

        document.ontouchmove = onTouchMove;
        document.ontouchend = () => {
            //console.log("touch end");
            document.ontouchmove = document.ontouchend = null;
        }
    }

    function onTouchMove(e)
    {
        //console.log("mouse move: " + e.touches[0].clientX);
        var delta = {x: e.touches[0].clientX - md.e.touches[0].clientX,
                     y: e.touches[0].clientY - md.e.touches[0].clientY};

        if (direction === "H" ) // Horizontal
        {
            // Prevent splitter to become moved out of visible area
            delta.x = Math.min(Math.max(delta.x, -md.firstWidth),
                       md.secondWidth);
		
            element.style.left = md.offsetLeft + delta.x + "px";
            first.style.width = (md.firstWidth + delta.x) + "px";
            second.style.width = (md.secondWidth - delta.x) + "px";
        }
    }
}

dragElement( document.getElementById("separator"), "H" );


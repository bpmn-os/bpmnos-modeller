import inherits from 'inherits';

import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';

import {
  append as svgAppend,
  innerSVG,
  attr as svgAttr,
  create as svgCreate
} from 'tiny-svg';

import {
  getRoundRectPath
} from 'bpmn-js/lib/draw/BpmnRenderUtil';

import {
  getBusinessObject,
  is
} from 'bpmn-js/lib/util/ModelUtil';

export default function ResourceRenderer(eventBus) {
  BaseRenderer.call(this, eventBus, 2000);
}

inherits(ResourceRenderer, BaseRenderer);

ResourceRenderer.$inject = [ 'eventBus', 'styles' ];


ResourceRenderer.prototype.canRender = function(element) {
  if (!is(element, 'bpmn:Task')) {
    return;
  }

  var businessObject = getBusinessObject(element);

  return businessObject.type;
};

ResourceRenderer.prototype.drawShape = function(parentNode, element) {
  var businessObject = element.businessObject,
      type = businessObject.type;

  var width = element.width,
      height = element.height;

  // set line thickness for request / release
  var border = (type == 'Release') ? 4 : 2;
  var rect = drawRect(0, width, height, border);
  svgAppend(parentNode, rect);
  rect = drawRect(width/3, width/3, height, border);
  svgAppend(parentNode, rect);

  if (businessObject.name) {
    var lines = businessObject.name.trim().split('\n');
    var textArea = svgCreate('text');
    var text = '';
    var fontsize = 12;
    for (var i = 0; i < lines.length; ++i) {
      text += '<tspan x="' + width/2 + '" y="-' + ((lines.length-i)*fontsize-fontsize/2) + '">' + lines[i] + '</tspan>';
    }
    innerSVG(textArea,text);
    svgAttr(textArea, {
      fontFamily: 'Arial, sans-serif',
      fontSize: fontsize,
      textAnchor: 'middle',
      width: width,
      x: width,
      y: 0
    });
    svgAppend(parentNode, textArea);
  }
  return rect;
};

ResourceRenderer.prototype.getShapePath = function(shape) {
  return getRoundRectPath(shape, 0);
};

function drawRect(x, width, height, border) {
  var rect = svgCreate('rect');

  svgAttr(rect, {
    x: x,
    y: 0,
    width: width,
    height: height,
    stroke: 'black',
    strokeWidth: border,
    fill: 'white'
  });

  return rect;
}

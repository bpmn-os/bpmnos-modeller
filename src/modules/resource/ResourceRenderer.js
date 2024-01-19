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
  if (!is(element, 'bpmn:Activity') || element.type == 'label') {
    return;
  }

  var businessObject = getBusinessObject(element);

  return (businessObject.type == 'Resource' || businessObject.type == 'Request' || businessObject.type == 'Release');
};

ResourceRenderer.prototype.drawShape = function(parentNode, element) {
  var businessObject = element.businessObject,
      type = businessObject.type;

  var width = element.width,
      height = element.height;

  // set line thickness for request / release
  var boundary = drawRect(0, width, height, 0);
  var border = (type == 'Release') ? 4 : 2;
  if ( type == 'Resource') {
    let offset=2;
    var halfcircle = drawShape('path', { d: "M" + (0.45*height + offset) + ",0  a1,1 0 0,0 0," + height, stroke: 'black', strokeWidth: 2, fill: 'white' } );
    svgAppend(parentNode, halfcircle);
    halfcircle = drawShape('path', { d: "M" + (width-0.45*height - offset) + ",0  a1,1 0 0,1 0," + height, stroke: 'black', strokeWidth: 2, fill: 'white' } );
    svgAppend(parentNode, halfcircle);

    var rect = drawRect(0.45*height, width-2*0.45*height, height, 0);
    svgAppend(parentNode, rect);

    var line =  drawShape('line', { x1: 0.45*height, y1: 0, x2: width-0.45*height, y2: 0, stroke: 'black', strokeWidth: 2, fill: 'white' } );
    svgAppend(parentNode, line);
    line =  drawShape('line', { x1: 0.45*height, y1: height, x2: width-0.45*height, y2: height, stroke: 'black', strokeWidth: 2, fill: 'white' } );
    svgAppend(parentNode, line);
 
    var circle = drawCircle(0.2*height+1, width, height);
    svgAppend(parentNode, circle);
    circle = drawCircle(height, width, height);
    svgAppend(parentNode, circle);
    circle = drawCircle(1.8*height-1, width, height);
    svgAppend(parentNode, circle);
  }
  else {
    var rect = drawRect(0, width, height, border);
    svgAppend(parentNode, rect);
    var rect = drawRect(width/3, width/3, height, border);
    svgAppend(parentNode, rect);
  }

  return boundary;
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


function drawShape(type, attr) {
  var shape = svgCreate(type);
  svgAttr(shape,attr);
  return shape;
}

function drawCircle(x, width, height) {
  var circle = svgCreate('circle');

  svgAttr(circle, {
    cx: x + height/4,
    cy: height/2,
    r: height/4,
    stroke: 'black',
    strokeWidth: 8,
    fill: 'white'
  });

  return circle;
}

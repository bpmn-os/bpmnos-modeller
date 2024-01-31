import inherits from 'inherits';

import {
  create as svgCreate,
  append as svgAppend,
  attr as svgAttr
} from 'tiny-svg';

import BpmnRenderer from 'bpmn-js/lib/draw/BpmnRenderer';

import {
  getBusinessObject,
  is
} from 'bpmn-js/lib/util/ModelUtil';


export default function SequencerDecorator(
    config, eventBus, styles,
    pathMap, canvas, textRenderer) {

  BpmnRenderer.call(
    this,
    config, eventBus, styles,
    pathMap, canvas, textRenderer,
    1400
  );

  this.canRender = function(element) {
    if ( element.type != 'bpmn:SubProcess' ) {
      return;
    }
    var businessObject = getBusinessObject(element);

    if ( businessObject.triggeredByEvent ) {
      return;
    }

    return ( businessObject.type == "Sequencer" );
  };

  this.drawShape = function(parentNode, shape) {
    var width = 14,
        height = 9;
    var x = 9 , y = 6;

    var bpmnShape = this.drawBpmnShape(parentNode, shape);

    var rect = drawRect(x, y, width, height, 0);
    svgAppend(parentNode, rect);
    var halfcircle = drawCustomShape('path', { d: "M" + x + "," + y +"  a1,1 0 0,0 0," + height, stroke: 'black', strokeWidth: 1, fill: 'white' } );
    svgAppend(parentNode, halfcircle);
    halfcircle = drawCustomShape('path', { d: "M" + (x+width) + "," + y +"  a1,1 0 0,1 0," + height, stroke: 'black', strokeWidth: 1, fill: 'white' } );
    svgAppend(parentNode, halfcircle);
    var line =  drawCustomShape('line', { x1: x, y1: y, x2: (x+width), y2: y, stroke: 'black', strokeWidth: 1, fill: 'white' } );
    svgAppend(parentNode, line);
    line =  drawCustomShape('line', { x1: x, y1: y+height, x2: (x+width), y2: y+height, stroke: 'black', strokeWidth: 1, fill: 'white' } );
    svgAppend(parentNode, line);
 
    var circle = drawCircle(x+1.5, y+height/2);
    svgAppend(parentNode, circle);
    circle = drawCircle(x+width/2+1, y+height/2);
    svgAppend(parentNode, circle);
    circle = drawCircle(x+width+0.5, y+height/2);
    svgAppend(parentNode, circle);

    return bpmnShape;
  };
}

function drawCustomShape(type, attr) {
  var shape = svgCreate(type);
  svgAttr(shape,attr);
  return shape;
}

function drawRect(x, y, width, height, border) {
  var rect = svgCreate('rect');

  svgAttr(rect, {
    x: x,
    y: y,
    width: width,
    height: height,
    stroke: 'black',
    strokeWidth: border,
    fill: 'white'
  });

  return rect;
}

function drawCircle(x, y) {
  var circle = svgCreate('circle');

  svgAttr(circle, {
    cx: x-1,
    cy: y,
    r: 2,
    stroke: 'black',
    strokeWidth: 2,
    fill: 'white'
  });

  return circle;
}

inherits(SequencerDecorator, BpmnRenderer);

SequencerDecorator.prototype.drawBpmnShape = BpmnRenderer.prototype.drawShape;


SequencerDecorator.$inject = [
  'config.bpmnRenderer',
  'eventBus',
  'styles',
  'pathMap',
  'canvas',
  'textRenderer'
];

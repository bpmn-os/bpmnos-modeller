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


export default function DecisionTaskDecorator(
    config, eventBus, styles,
    pathMap, canvas, textRenderer) {

  BpmnRenderer.call(
    this,
    config, eventBus, styles,
    pathMap, canvas, textRenderer,
    1400
  );

  this.canRender = function(element) {
    if ( element.type != 'bpmn:Task' ) {
      return;
    }

    return ( getBusinessObject(element).type == "Decision" );
  };

  this.drawShape = function(parentNode, shape) {

    var bpmnShape = this.drawBpmnShape(parentNode, shape);

    var branchingArrow = drawCustomShape('path', { d: 'm 14 5 l -0.02 0.7619 l -0.4067 0.1238 c -0.8933 0.2571 -1.0933 0.3429 -2.6067 2.2095 c -0.4866 1.1334 -0.7867 1.1238 -1.0333 1.2952 l -0.3467 0.2476 h -3.7066 v 2.0952 h 1.78 c 2.1667 0 2.2533 -0.0476 3.22 1.4095 c 1.1533 1.7429 1.78 2.0762 2.6733 2.3333 l 0.4267 0.1238 l 0.02 0.7714 l 0.02 0.7714 l 1.5267 -1.2571 c 0.84 -0.6857 1.5267 -1.2762 1.5333 -1.3143 c 0 -0.0286 -0.68 -0.619 -1.5133 -1.3048 l -1.52 -1.2476 l -0.02 0.7143 c -0.02 0.6667 -0.0267 0.7143 -0.1667 0.7143 c -0.38 0 -0.88 -0.2286 -1.7467 -1.5048 l -0.8733 -1.2667 l 0.8733 -1.2762 c 0.8733 -1.2762 1.3533 -1.4762 1.7467 -1.4762 c 0.14 0 0.1467 0.0476 0.1667 0.7143 l 0.02 0.7143 l 1.52 -1.2476 c 0.8333 -0.6857 1.5133 -1.2762 1.5133 -1.3048 c -0.007 -0.0381 -0.6933 -0.6286 -1.5333 -1.3143 l -1.5267 -1.2571 z', stroke: 'black', strokeWidth: '.5', fill: 'black' } );
    svgAppend(parentNode, branchingArrow);

    return bpmnShape;
  };
}

function drawCustomShape(type, attr) {
  var shape = svgCreate(type);
  svgAttr(shape,attr);
  return shape;
}

inherits(DecisionTaskDecorator, BpmnRenderer);

DecisionTaskDecorator.prototype.drawBpmnShape = BpmnRenderer.prototype.drawShape;


DecisionTaskDecorator.$inject = [
  'config.bpmnRenderer',
  'eventBus',
  'styles',
  'pathMap',
  'canvas',
  'textRenderer'
];

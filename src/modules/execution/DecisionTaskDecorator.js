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

    var branchingArrow = drawCustomShape('path', { d: 'm18.78 5.0714-0.03003 1.1429-0.61 0.18572c-1.34 0.38571-3.87 0.94286-5.41 3.3143-0.72 1.1-1.18 1.6857-1.55 1.9429l-0.52 0.37143h-4.06v3.1429h2.67c3.25 0 1.88-0.0714 3.33 2.1143 1.73 2.6143 4.17 3.1143 5.51 3.5l0.64001 0.18572 0.03003 1.1571 0.03003 1.1571 2.29-1.8857c1.26-1.0286 2.29-1.9143 2.3-1.9714 0-0.0429-1.02-0.92858-2.27-1.9572l-2.28-1.8714-0.03003 1.0714c-0.03003 1-0.04001 1.0714-0.25 1.0714-0.57 0-2.82-0.34287-4.12-2.2572l-1.31-1.9 1.31-1.9143c1.31-1.9143 3.53-2.2143 4.12-2.2143 0.21 0 0.22 0.07143 0.25 1.0714l0.03003 1.0714 2.28-1.8714c1.2499-1.0286 2.2699-1.9143 2.2699-1.9571-0.0105-0.05715-1.04-0.94286-2.3-1.9714l-2.29-1.8857z', stroke: 'black', strokeWidth: '.5', fill: 'black' } );
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

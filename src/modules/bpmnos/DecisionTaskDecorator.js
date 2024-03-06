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

    var branchingArrow = drawCustomShape('path', { d: 'm 12.3765 9.8338 c 0.4627 -1.0288 0.7177 -1.5952 2.2439 -1.5952 h 0.9873 v 2.2002 l 3.2183 -3.2198 l -3.2183 -3.219 v 2.2001 h -0.9873 c -2.844 0 -3.6014 1.6833 -4.1028 2.7972 c -0.4247 0.9438 -0.6395 1.4209 -1.7567 1.4835 h -3.5866 l 3.6643 0.0012 c 1.2193 0.0612 1.9879 0.4795 2.5146 1.0179 c 0.503 -0.5141 0.7853 -1.1373 1.0233 -1.6661 z m 6.4493 5.9467 l -3.2183 -3.219 v 2.2001 h -0.9873 c -1.526 0 -1.781 -0.5667 -2.2439 -1.5952 c -0.2378 -0.5286 -0.5203 -1.152 -1.0233 -1.6662 c -0.5267 -0.5383 -1.2953 -0.9568 -2.5146 -1.0179 l -3.6643 -0.0014 v 2.0383 h 3.5866 c 1.1175 0.0625 1.3321 0.5397 1.7567 1.4835 c 0.5011 1.1139 1.2586 2.7972 4.1028 2.7972 h 0.9873 v 2.2002 z', stroke: 'black', strokeWidth: '.5', fill: 'black' } );
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

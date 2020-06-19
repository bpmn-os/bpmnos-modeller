'use strict';

var inherits = require('inherits');

var PropertiesActivator = require('bpmn-js-properties-panel/lib/PropertiesActivator');

var is = require('bpmn-js/lib/util/ModelUtil').is;

// bpmn properties
var idProps = require('../bpmn/parts/IdProps'),
    nameProps = require('../bpmn/parts/NameProps');

// execution properties
var statusProps = require('./parts/StatusProps'),
    operatorProps = require('./parts/OperatorProps'),
    restrictionProps = require('./parts/RestrictionProps'),
    messageProps = require('./parts/MessageProps');

var getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;

function createGeneralTabGroups(
    element, canvas, bpmnFactory,
    elementRegistry, elementTemplates, translate) {

  // refer to target element for external labels
  element = element.labelTarget || element;

  var groups = [];

  var generalGroup = {
    id: 'general-group',
    label: translate('Element'),
    entries: []
  };

  var idOptions;
  idProps(generalGroup, element, translate, idOptions);
  nameProps(generalGroup, element, bpmnFactory, canvas, translate);

  groups.push(generalGroup);

  return groups;
}

function createStatusTabGroups(element, bpmnFactory, elementRegistry, translate) {
  var statusGroup = {
    id: 'status-group',
    label: translate('Status'),
    entries: []
  };
  var statusOptions;

  statusProps(statusGroup, element, bpmnFactory, translate);

  return [
    statusGroup
  ];
}

function createOperatorTabGroups(element, bpmnFactory, elementRegistry, translate) {
  var operatorGroup = {
    id : 'operator-group',
    label : translate('Operators'),
    entries: []
  };
  operatorProps(operatorGroup, element, bpmnFactory, translate);

  return [
    operatorGroup
  ];
}


function createRestrictionsTabGroups(element, bpmnFactory, elementRegistry, translate) {
  var restrictionsGroup = {
    id : 'restrictions-group',
    label : translate('Restrictions'),
    entries: []
  };
  restrictionProps(restrictionsGroup, element, bpmnFactory, translate);

  return [
    restrictionsGroup
  ];
}

function createMessageTabGroups(element, bpmnFactory, elementRegistry, translate) {
  var messageGroup = {
    id : 'message-group',
    label : translate('Message'),
    entries: []
  };
  messageProps(messageGroup, element, bpmnFactory, translate);

  return [
    messageGroup
  ];
}

// Execution Properties Provider /////////////////////////////////////


/**
 * A properties provider for execution related properties.
 *
 * @param {EventBus} eventBus
 * @param {Canvas} canvas
 * @param {BpmnFactory} bpmnFactory
 * @param {ElementRegistry} elementRegistry
 * @param {ElementTemplates} elementTemplates
 * @param {Translate} translate
 */
function ExecutionPropertiesProvider(
    eventBus, canvas, bpmnFactory,
    elementRegistry, elementTemplates, translate) {

  PropertiesActivator.call(this, eventBus);

  this.getTabs = function(element) {

    var generalTab = {
      id: 'general',
      label: translate('Element'),
      groups: createGeneralTabGroups(
        element, canvas, bpmnFactory,
        elementRegistry, elementTemplates, translate)
    };

    var statusTab = {
      id: 'status',
      label: translate('Status'),
      groups: createStatusTabGroups(element, bpmnFactory, elementRegistry, translate)
    };

    var operatorsTab = {
      id: 'operators',
      label: translate('Operators'),
      groups: createOperatorTabGroups(element, bpmnFactory, elementRegistry, translate)
    };

    var restrictionsTab = {
      id: 'restrictions',
      label: translate('Restrictions'),
      groups: createRestrictionsTabGroups(element, bpmnFactory, elementRegistry, translate)
    };

    var messageTab = {
      id: 'message',
      label: translate('Message'),
      groups: createMessageTabGroups(element, bpmnFactory, elementRegistry, translate)
    };

    return [
      generalTab,
      statusTab,
      operatorsTab,
      restrictionsTab,
      messageTab,
    ];
  };

}

ExecutionPropertiesProvider.$inject = [
  'eventBus',
  'canvas',
  'bpmnFactory',
  'elementRegistry',
  'elementTemplates',
  'translate'
];

inherits(ExecutionPropertiesProvider, PropertiesActivator);

module.exports = ExecutionPropertiesProvider;

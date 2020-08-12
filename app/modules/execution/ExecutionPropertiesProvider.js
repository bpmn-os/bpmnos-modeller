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
    messageProps = require('./parts/MessageProps'),
    timerProps = require('./parts/TimerProps'),
    requestProps = require('./parts/RequestProps'),
    releaseProps = require('./parts/ReleaseProps'),
    resourceProps = require('./parts/ResourceProps');

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

function createTimerTabGroups(element, bpmnFactory, elementRegistry, translate) {
  var timerGroup = {
    id : 'timer-group',
    label : translate('Timer'),
    entries: []
  };
  timerProps(timerGroup, element, bpmnFactory, translate);

  return [
    timerGroup
  ];
}

function createRequestTabGroups(element, bpmnFactory, elementRegistry, translate) {
  var requestGroup = {
    id : 'request-group',
    label : translate('Resource allocation'),
    entries: []
  };
  requestProps(requestGroup, element, bpmnFactory, translate);

  return [
    requestGroup
  ];
}

function createReleaseTabGroups(element, bpmnFactory, elementRegistry, translate) {
  var releaseGroup = {
    id : 'release-group',
    label : translate('Resource allocation'),
    entries: []
  };
  releaseProps(releaseGroup, element, bpmnFactory, translate);

  return [
    releaseGroup
  ];
}

function createResourcesTabGroups(element, bpmnFactory, elementRegistry, translate) {
  var resourcesGroup = {
    id : 'resource-group',
    label : translate('Resource'),
    entries: []
  };
  resourceProps(resourcesGroup, element, bpmnFactory, translate);

  return [
    resourcesGroup
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

    var timerTab = {
      id: 'timer',
      label: translate('Timer'),
      groups: createTimerTabGroups(element, bpmnFactory, elementRegistry, translate)
    };

    var requestTab = {
      id: 'request',
      label: translate('Request'),
      groups: createRequestTabGroups(element, bpmnFactory, elementRegistry, translate)
    };

    var releaseTab = {
      id: 'release',
      label: translate('Release'),
      groups: createReleaseTabGroups(element, bpmnFactory, elementRegistry, translate)
    };

    var resourcesTab = {
      id: 'resources',
      label: translate('Resources'),
      groups: createResourcesTabGroups(element, bpmnFactory, elementRegistry, translate)
    };

    return [
      generalTab,
      statusTab,
      operatorsTab,
      restrictionsTab,
      messageTab,
      timerTab,
      requestTab,
      releaseTab,
      resourcesTab,
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

'use strict';

var inherits = require('inherits');

var PropertiesActivator = require('bpmn-js-properties-panel/lib/PropertiesActivator');

var is = require('bpmn-js/lib/util/ModelUtil').is;

// bpmn properties
var idProps = require('../bpmn/parts/IdProps'),
    nameProps = require('../bpmn/parts/NameProps');

// execution properties
var statusProps = require('./parts/StatusProps'),
    dataProps = require('./parts/DataProps'),
    operatorProps = require('./parts/OperatorProps'),
    restrictionProps = require('./parts/RestrictionProps'),
    messageProps = require('./parts/MessageProps'),
    timerProps = require('./parts/TimerProps'),
    requestProps = require('./parts/RequestProps'),
    releaseProps = require('./parts/ReleaseProps'),
    resourceProps = require('./parts/ResourceProps'),
    allocationStatusProps = require('./parts/AllocationStatusProps'),
    allocationRestrictionProps = require('./parts/AllocationRestrictionProps');

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
  statusProps(statusGroup, element, bpmnFactory, translate);

  return [
    statusGroup
  ];
}

function createAllocationStatusTabGroups(element, bpmnFactory, elementRegistry, translate) {
  var allocationStatusGroup = {
    id: 'allocation-status-group',
    label: translate('Status (Allocations)'),
    entries: []
  };
  allocationStatusProps(allocationStatusGroup, element, bpmnFactory, translate);

  return [
    allocationStatusGroup
  ];
}

function createDataTabGroups(element, bpmnFactory, elementRegistry, translate) {
  var dataGroup = {
    id: 'data-group',
    label: translate('Data'),
    entries: []
  };
  dataProps(dataGroup, element, bpmnFactory, translate);

  return [
    dataGroup
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

function createAllocationRestrictionsTabGroups(element, bpmnFactory, elementRegistry, translate) {
  var allocationRestrictionsGroup = {
    id : 'allocation-restrictions-group',
    label : translate('Restrictions (Allocations)'),
    entries: []
  };
  allocationRestrictionProps(allocationRestrictionsGroup, element, bpmnFactory, translate);

  return [
    allocationRestrictionsGroup
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
    label : translate('Resource allocations'),
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
    label : translate('Resource allocations'),
    entries: []
  };
  releaseProps(releaseGroup, element, bpmnFactory, translate);

  return [
    releaseGroup
  ];
}

function createResourceTabGroups(element, bpmnFactory, elementRegistry, translate) {
  var resourceGroup = {
    id : 'resource-group',
    label : translate('Resource'),
    entries: []
  };
  resourceProps(resourceGroup, element, bpmnFactory, translate);

  return [
    resourceGroup
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

    var allocationStatusTab = {
      id: 'allocation-status',
      label: translate('Status (Allocations)'),
      groups: createAllocationStatusTabGroups(element, bpmnFactory, elementRegistry, translate)
    };

    var dataTab = {
      id: 'data',
      label: translate('Data'),
      groups: createDataTabGroups(element, bpmnFactory, elementRegistry, translate)
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

    var allocationRestrictionsTab = {
      id: 'allocation-restrictions',
      label: translate('Restrictions (Allocations)'),
      groups: createAllocationRestrictionsTabGroups(element, bpmnFactory, elementRegistry, translate)
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

    var resourceTab = {
      id: 'resource',
      label: translate('Resource'),
      groups: createResourceTabGroups(element, bpmnFactory, elementRegistry, translate)
    };

    return [
      generalTab,
      messageTab,
      timerTab,
      requestTab,
      releaseTab,
      resourceTab,
      dataTab,
      statusTab,
      allocationStatusTab,
      restrictionsTab,
      allocationRestrictionsTab,
      operatorsTab,
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

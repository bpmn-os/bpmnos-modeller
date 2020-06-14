'use strict';

var inherits = require('inherits');

var PropertiesActivator = require('bpmn-js-properties-panel/lib/PropertiesActivator');

var is = require('bpmn-js/lib/util/ModelUtil').is;

// bpmn properties
var idProps = require('../bpmn/parts/IdProps'),
    nameProps = require('../bpmn/parts/NameProps');

// execution properties
var globalsProps = require('./parts/ProcessProps'),
    statusProps = require('./parts/StatusProps'),
    restrictionProps = require('./parts/RestrictionProps');

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

function createProcessTabGroups(element, bpmnFactory, elementRegistry, translate) {
  var processGroup = {
    id: 'process-group',
    label: translate('Globals'),
    entries: []
  };
  var processOptions;

  globalsProps(processGroup, element, bpmnFactory, translate);

  return [
    processGroup
  ];
}

function createStatusTabGroups(element, bpmnFactory, elementRegistry, translate) {
  var statusGroup = {
    id : 'status-group',
    label : translate('Status'),
    entries: []
  };
  statusProps(statusGroup, element, bpmnFactory, translate);

  return [
    statusGroup
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

    var processTab = {
      id: 'process',
      label: translate('Process'),
      groups: createProcessTabGroups(element, bpmnFactory, elementRegistry, translate)
    };

    var statusTab = {
      id: 'status',
      label: translate('Status'),
      groups: createStatusTabGroups(element, bpmnFactory, elementRegistry, translate)
    };

    var restrictionsTab = {
      id: 'restrictions',
      label: translate('Restrictions'),
      groups: createRestrictionsTabGroups(element, bpmnFactory, elementRegistry, translate)
    };

    return [
      generalTab,
      processTab,
      statusTab,
      restrictionsTab,
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

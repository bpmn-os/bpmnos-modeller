'use strict';

var is = require('bpmn-js/lib/util/ModelUtil').is,
    getBO = require('bpmn-js/lib/util/ModelUtil').getBusinessObject,
    getBusinessObject =  function getBusinessObject(element) { return is(element, 'bpmn:Participant') ? getBO(element).processRef : getBO(element); };

var getExtensionElements = require('bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper').getExtensionElements,
    removeEntry = require('bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper').removeEntry,
    entryFactory = require('bpmn-js-properties-panel/lib/factory/EntryFactory'),
    elementHelper = require('bpmn-js-properties-panel/lib/helper/ElementHelper'),
    participantHelper = require('bpmn-js-properties-panel/lib/helper/ParticipantHelper'),
    cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper'),
    utils = require('bpmn-js-properties-panel/lib/Utils'),
    find = require('lodash/find');

var extensionElements = require('./ExtensionElements'), helper = require('./Helper');


module.exports = function(group, element, bpmnFactory, translate) {
  var bo = getBusinessObject(element);
  if (!( is(element, 'bpmn:CatchEvent') && bo.eventDefinitions && bo.eventDefinitions[0].$type == "bpmn:TimerEventDefinition" )) {
    return;
  }

  /// Attribute value input field
  group.entries.push(entryFactory.textField(translate, {
    id: 'timer-attribute',
    label: translate('Attribute name of status'),
    modelProperty: 'name',
    get: function(element, node) {
      var extensionElement = getBusinessObject(element).get('extensionElements') || {};
      var attribute = (extensionElement.values || [])[0] || {};
      return { name: attribute.name };
    },
    set: function(element, values, node) {
      var commands = [];
      var bo = getBusinessObject(element);
      var extensionElement = bo.get('extensionElements');
      if (!extensionElement) {
        extensionElement = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
        commands.push(cmdHelper.updateBusinessObject(element, bo, { extensionElements: extensionElement }));
      }
      var attribute = (extensionElement.values || [])[0];
console.warn(attribute);
      if ( !attribute ) {
         attribute = elementHelper.createElement('execution:Attribute', { type: 'xs:integer' }, extensionElement, bpmnFactory);
         commands.push(cmdHelper.addAndRemoveElementsFromList(
          element,
          extensionElement,
          'values',
          'extensionElements',
          [attribute],
          []
        ));
      }
      commands.push(cmdHelper.updateBusinessObject(element, attribute, values));

      return commands;
    },
    hidden: function(element, node) {
      return false;
    }
  }));

  /// Attribute value input field
  group.entries.push(entryFactory.textField(translate, {
    id: 'timer-value',
    label: translate('Value'),
    modelProperty: 'value',
    get: function(element, node) {
      var extensionElement = getBusinessObject(element).get('extensionElements') || {};
      var attribute = (extensionElement.values || [])[0] || {};
      return { value: attribute.value };
    },
    set: function(element, values, node) {
      var commands = [];
      var bo = getBusinessObject(element);
      var extensionElement = bo.get('extensionElements');
      if (!extensionElement) {
        extensionElement = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
        commands.push(cmdHelper.updateBusinessObject(element, bo, { extensionElements: extensionElement }));
      }
      var attribute = (extensionElement.values || [])[0];
      if ( !attribute ) {
         attribute = elementHelper.createElement('execution:Attribute', { type: 'xs:integer' }, extensionElement, bpmnFactory);
         commands.push(cmdHelper.addAndRemoveElementsFromList(
          element,
          extensionElement,
          'values',
          'extensionElements',
          [attribute],
          []
        ));
      }
      commands.push(cmdHelper.updateBusinessObject(element, attribute, values));

      return commands;
    },

    hidden: function(element, node) {
      return false;
    }
  }));

};

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

  if ( !is(element, 'bpmn:Task') || getBusinessObject(element).type != "Resource" ) {
    return;
  }

  function getSelectedObject(element, node) {
    var selected = selectEntry.getSelected(element, node.parentNode);
    if (selected.idx === -1 || selected.idx == undefined) {
      return;
    }
    var allocationElement = helper.getContainerElement(element, 'execution:Allocations');
    var attribute = undefined;
    if ( allocationElement && allocationElement.status ) {
	attribute = allocationElement.status[0].attribute[selected.idx]; 
    }
    return attribute;
  }

  // Select box entry
  var selectEntry = extensionElements(element, bpmnFactory, {
    id: 'allocation-attributes',
    label: translate('Attributes'),
    modelProperty: 'id',
    prefix: 'Attribute',
    createExtensionElement: function(element, extensionElement, value) {
      var bo = getBusinessObject(element), commands = [];

      if (!extensionElement) {
        extensionElement = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
        commands.push(cmdHelper.updateProperties(element, { extensionElements: extensionElement }));
      }

      var allocationElement = helper.getContainerElement(element,'execution:Allocations');
      if (!allocationElement) {
        allocationElement = elementHelper.createElement('execution:Allocations', {}, extensionElement, bpmnFactory);
        commands.push(cmdHelper.addAndRemoveElementsFromList(
          element,
          extensionElement,
          'values',
          'extensionElements',
          [allocationElement],
          []
        ));
      }

      var containerElement = undefined;
      if ( allocationElement.status ) containerElement = allocationElement.status[0];

      if (!containerElement) {
        containerElement = elementHelper.createElement('execution:Status', {}, allocationElement, bpmnFactory);
        commands.push(cmdHelper.addElementsTolist(element, allocationElement, 'status', [ containerElement ]));
      }

      var attribute = elementHelper.createElement('execution:Attribute', { id: value, type: 'xs:string' }, containerElement, bpmnFactory);
        commands.push(cmdHelper.addElementsTolist(element, containerElement, 'attribute', [ attribute ]));
      return commands;
    },
    removeExtensionElement: function(element, extensionElement, value, idx) {
      var containerElement = helper.getContainerElement(element,'execution:Allocations').status[0];
      var entry = containerElement.attribute[idx],
          commands = [];

      if (containerElement.attribute.length < 2) {
        commands.push(removeEntry(getBusinessObject(element), element, containerElement));
      } else {
        commands.push(cmdHelper.removeElementsFromList(element, containerElement, 'attribute', null, [entry]));
      }

      return commands;
    },
    getExtensionElements: function(element) {
      var allocationElement = helper.getContainerElement(element,'execution:Allocations');
      if (allocationElement && allocationElement.status && allocationElement.status.length) {

	      return allocationElement.status[0].attribute;	
      }
      return [];
    },
    hideExtensionElements: function(element, node) {
      return false;
    }
  });
  group.entries.push(selectEntry);

  // Attribute id entry
  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: 'allocation-attribute-id',
    label: translate('Id'),
    modelProperty: 'id',

    getProperty: function(element, node) {
      var attribute = getSelectedObject(element, node) || {}; 
      return attribute.id;
    },

    setProperty: function(element, properties, node) {
      var attribute = getSelectedObject(element, node);
      return cmdHelper.updateBusinessObject(element, attribute, properties);
    },

    hidden: function(element, node) {
      return !getSelectedObject(element, node);
    },

    validate: function(element, values, node) {
      var attribute = getSelectedObject(element, node) || {};
      if (attribute) {
        var idValue = values.id;
        if (!idValue || idValue.trim() === '') {
          return { id: 'Id must not be empty.' };
        }
        var attributes = helper.getObjectList(element,'execution:Status')
        var existingId = find(attributes, function(f) {
          return f !== attribute && f.id === idValue;
        });
        if (existingId) {
          return { id: 'Id is already used.' };
        }
      }
    }
  }));

  // Attribute name entry
  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: 'allocation-attribute-name',
    label: translate('Name'),
    modelProperty: 'name',

    getProperty: function(element, node) {
      var attribute = getSelectedObject(element, node) || {}; 
      return attribute.name;
    },

    setProperty: function(element, properties, node) {
      var attribute = getSelectedObject(element, node);
      return cmdHelper.updateBusinessObject(element, attribute, properties);
    },

    hidden: function(element, node) {
      return !getSelectedObject(element, node);
    },

    validate: function(element, values, node) {
      var attribute = getSelectedObject(element, node) || {};
      if (attribute) {
        if (!values.name || values.name.trim() === '') {
          return { name: 'Name must not be empty.' };
        }
      }
    }
  }));

  // Select attribute type
  group.entries.push(entryFactory.selectBox(translate, {
    id: 'allocation-attribute-type',
    label: translate('Type'),
    modelProperty : 'type',
    emptyParameter: false,
    selectOptions: [
//      { name: '<inherit>', value: '' },
      { name: 'string', value: 'xs:string' },
      { name: 'integer', value: 'xs:integer' },
      { name: 'decimal', value: 'xs:decimal' },
      { name: 'boolean', value: 'xs:boolean' }
    ],
    get: function(element, node) {
      var object = getSelectedObject(element, node) || {};
      return {
        type: object.type || 'xs:string'
      };
    },
    set: function(element, properties, node) {
console.log(properties);
//      if ( properties.type == '' ) properties.type = 'xs:string';
      var attribute = getSelectedObject(element, node);
      return cmdHelper.updateBusinessObject(element, attribute, properties);
    },
    hidden: function(element, node) {
      return !getSelectedObject(element, node);
    },
  }));

  /// Attribute value input field
  group.entries.push(entryFactory.textField(translate, {
    id: 'allocation-attribute-value',
    label: translate('Value'),
    modelProperty: 'value',
    get: function(element, node) {
      var attribute = getSelectedObject(element, node) || {}; 
      return { value: attribute.value };
    },

    set: function(element, properties, node) {
      var attribute = getSelectedObject(element, node);
      return cmdHelper.updateBusinessObject(element, attribute, properties);
    },
    hidden: function(element, node) {
      return !getSelectedObject(element, node);
    }
  }));

  // Select attribute objective
  group.entries.push(entryFactory.selectBox(translate, {
    id: 'allocation-attribute-objective',
    label: translate('Objective'),
    modelProperty : 'objective',
    emptyParameter: false,
    selectOptions: [
      { name: 'none', value: '' },
      { name: 'maximize', value: 'maximize' },
      { name: 'minimize', value: 'minimize' }
    ],
    get: function(element, node) {
      var object = getSelectedObject(element, node) || {};
      return {
        objective: object.objective || ''

      };
    },
    set: function(element, properties, node) {
//console.log(properties);
      if ( properties.objective == '' ) {
	properties.objective = undefined;
	properties.weight = undefined;
      }
      else if ( !properties.weight ) {
	properties.weight = "1";
      }
//console.log(properties);
      var attribute = getSelectedObject(element, node);
      return cmdHelper.updateBusinessObject(element, attribute, properties);
    },
    hidden: function(element, node) {
      return !getSelectedObject(element, node);
    },
  }));

  /// Attribute weight input field
  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: 'allocation-attribute-weight',
    label: translate('Objective weight'),
    modelProperty: 'weight',
    getProperty: function(element, node) {
      var attribute = getSelectedObject(element, node) || {}; 
      return attribute.weight;
    },

    setProperty: function(element, properties, node) {
      var attribute = getSelectedObject(element, node);
      return cmdHelper.updateBusinessObject(element, attribute, properties);
    },
    hidden: function(element, node) {
      var attribute = getSelectedObject(element, node) || {}; 
      return !attribute.objective;
    },
    validate: function(element, values, node) {
      var attribute = getSelectedObject(element, node) || {};
      if (attribute) {
        if ( !values.weight || isNaN(values.weight) || parseFloat(values.weight) <= 0) {
          return { weight: 'Weight must be a positive number!' };
        }
      }
    }
  }));

};

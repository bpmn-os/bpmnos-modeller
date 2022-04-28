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
  if ( !is(element, 'bpmn:DataObject') && !is(element, 'bpmn:DataObjectReference') ) {
    return;
  }

  function getSelectedAttribute(element, node) {
    var selected = attributesEntry.getSelected(element, node.parentNode);
    if (selected.idx === -1) {
      return;
    }
    return helper.getObject(element, selected.idx, 'execution:Data');
  }
/*
  // Process id entry
  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: 'process-id',
    label: translate('Process Id'),
    modelProperty: 'id',
    getProperty: function(element) {
      return getBusinessObject(element).id;
    },
    setProperty: function(element, properties) {
//      element = element.labelTarget || element;
      return cmdHelper.updateProperties(element, properties);
    },
    hidden: function(element, node) {
      return !is(element, 'bpmn:Process') && !is(element, 'bpmn:SubProcess') ;
    },
    validate: function(element, values) {
      var idValue = values.id;
      var bo = getBusinessObject(element);
      var idError = utils.isIdValid(bo, idValue, translate);
      return idError ? { id: idError } : {};
    }
  }));

  // Process id entry of participant
  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: 'participant-process-id',
    label: translate('(Sub-)Process Id'),
    modelProperty: 'id',
    getProperty: function(element) {
      return getBusinessObject(element).id;
    }, 
    setProperty: function(element, properties) {
      return participantHelper.modifyProcessBusinessObject(element, 'id', { id: properties.id });
    },
    hidden: function(element, node) {
      return !is(element, 'bpmn:Participant') ;
    },
    validate: function(element, values) {
      var idValue = values.id;
      var bo = getBusinessObject(element);
      var idError = utils.isIdValid(bo, idValue, translate);
      return idError ? { id: idError } : {};
    }
  }));
*/

  // Attributes entry
  var attributesEntry = extensionElements(element, bpmnFactory, {
    id: 'attributes',
    label: translate('Attributes'),
    modelProperty: 'id',
    prefix: 'Attribute',
    createExtensionElement: function(element, extensionElement, value) {
      var bo = getBusinessObject(element), commands = [];
      if (!extensionElement) {
        extensionElement = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
        commands.push(cmdHelper.updateProperties(element, { extensionElements: extensionElement }));
      }
      var containerElement = helper.getContainerElement(element,'execution:Data');
      if (!containerElement) {
        containerElement = elementHelper.createElement('execution:Data', {}, extensionElement, bpmnFactory);
        commands.push(cmdHelper.addAndRemoveElementsFromList(
          element,
          extensionElement,
          'values',
          'extensionElements',
          [containerElement],
          []
        ));
      }

      var attribute = elementHelper.createElement('execution:Attribute', { id: value, type: 'xs:string' }, containerElement, bpmnFactory);
        commands.push(cmdHelper.addElementsTolist(element, containerElement, 'attribute', [ attribute ]));
      return commands;
    },
    removeExtensionElement: function(element, extensionElement, value, idx) {
      var containerElement = helper.getContainerElement(element,'execution:Data');
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
      return helper.getObjectList(element,'execution:Data');
    },
    hideExtensionElements: function(element, node) {
      return false;
    }
  });
  group.entries.push(attributesEntry);

  // Attribute id entry
  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: 'attribute-id',
    label: translate('Id'),
    modelProperty: 'id',

    getProperty: function(element, node) {
      var attribute = getSelectedAttribute(element, node) || {}; 
      return attribute.id;
    },

    setProperty: function(element, properties, node) {
      var attribute = getSelectedAttribute(element, node);
      return cmdHelper.updateBusinessObject(element, attribute, properties);
    },

    hidden: function(element, node) {
      return !getSelectedAttribute(element, node);
    },

    validate: function(element, values, node) {
      var attribute = getSelectedAttribute(element, node) || {};
      if (attribute) {
        var idValue = values.id;
        if (!idValue || idValue.trim() === '') {
          return { id: 'Id must not be empty.' };
        }
        var attributes = helper.getObjectList(element,'execution:Data')
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
    id: 'attribute-name',
    label: translate('Name'),
    modelProperty: 'name',

    getProperty: function(element, node) {
      var attribute = getSelectedAttribute(element, node) || {}; 
      return attribute.name;
    },

    setProperty: function(element, properties, node) {
      var attribute = getSelectedAttribute(element, node);
      return cmdHelper.updateBusinessObject(element, attribute, properties);
    },

    hidden: function(element, node) {
      return !getSelectedAttribute(element, node);
    },

    validate: function(element, values, node) {
      var attribute = getSelectedAttribute(element, node) || {};
      if (attribute) {
        if (!values.name || values.name.trim() === '') {
          return { name: 'Name must not be empty.' };
        }
      }
    }
  }));

  // Select attribute type
  group.entries.push(entryFactory.selectBox(translate, {
    id: 'attribute-type',
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
      var object = getSelectedAttribute(element, node) || {};
      return {
        type: object.type || 'xs:string'
      };
    },
    set: function(element, properties, node) {
console.log(properties);
//      if ( properties.type == '' ) properties.type = 'xs:string';
      var attribute = getSelectedAttribute(element, node);
      return cmdHelper.updateBusinessObject(element, attribute, properties);
    },
    hidden: function(element, node) {
      return !getSelectedAttribute(element, node);
    },
  }));

  /// Attribute value input field
  group.entries.push(entryFactory.textField(translate, {
    id: 'attribute-value',
    label: translate('Value'),
    modelProperty: 'value',
    get: function(element, node) {
      var attribute = getSelectedAttribute(element, node) || {}; 
      return { value: attribute.value };
    },

    set: function(element, properties, node) {
      var attribute = getSelectedAttribute(element, node);
      return cmdHelper.updateBusinessObject(element, attribute, properties);
    },
    hidden: function(element, node) {
      return !getSelectedAttribute(element, node);
    }
  }));

};

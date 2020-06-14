'use strict';

var getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject,
    getExtensionElements = require('bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper').getExtensionElements,
    removeEntry = require('bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper').removeEntry,
    entryFactory = require('bpmn-js-properties-panel/lib/factory/EntryFactory'),
    elementHelper = require('bpmn-js-properties-panel/lib/helper/ElementHelper'),
    cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper'),
    is = require('bpmn-js/lib/util/ModelUtil').is,
    find = require('lodash/find');

var extensionElements = require('./ExtensionElements'), helper = require('./Helper');
var statusOperators = require('../statusOperators.json');

module.exports = function(group, element, bpmnFactory, translate) {

  if ( !is(element, 'bpmn:FlowNode') && !is(element, 'bpmn:MessageFlow') ) {
    return;
  }

  /**
   * Return the currently selected object querying the select box
   * from the DOM.
   *
   * @param  {djs.model.Base} element
   * @param  {DOMElement} node - DOM element belonging to the object
   *
   * @return {ModdleElement} the currently selected object
   */
  function getSelectedOperator(element, node) {
    var selected = operatorsEntry.getSelected(element, node.parentNode);
    if (selected.idx === -1) {
      return;
    }
    return helper.getObject(element, selected.idx, 'execution:Status');
  }

  function getSelectedAttribute(element, node) {
      var operator = getSelectedOperator(element, node);
      if ( !operator ) return;
      var selected = attributesEntry.getSelected(element, node.parentNode);
      if (selected.idx === -1) {
        return;
      }
//console.log(selected.idx, operator.attribute[selected.idx].key);
      return operator.attribute[selected.idx]
  }

  // Select box entry
  var operatorsEntry = extensionElements(element, bpmnFactory, {
    id: 'operator',
    label: translate('Operators'),
    modelProperty: 'id',
    prefix: 'Operator',
    createExtensionElement: function(element, extensionElement, value) {
      var bo = getBusinessObject(element), commands = [];

      if (!extensionElement) {
        extensionElement = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
        commands.push(cmdHelper.updateProperties(element, { extensionElements: extensionElement }));
      }
      var containerElement = helper.getContainerElement(element,'execution:Status');
      if (!containerElement) {
        containerElement = elementHelper.createElement('execution:Status', {}, extensionElement, bpmnFactory);
        commands.push(cmdHelper.addAndRemoveElementsFromList(
          element,
          extensionElement,
          'values',
          'extensionElements',
          [containerElement],
          []
        ));
      }

      var operator = elementHelper.createElement('execution:Operator', { id: value }, containerElement, bpmnFactory);
      commands.push(cmdHelper.addElementsTolist(element, containerElement, 'operator', [ operator ]));

      return commands;
    },
    removeExtensionElement: function(element, extensionElement, value, idx) {
      var containerElement = helper.getContainerElement(element,'execution:Status');
      var entry = containerElement.operator[idx],
          commands = [];

      if (containerElement.operator.length < 2) {
        commands.push(removeEntry(getBusinessObject(element), element, containerElement));
      } else {
        commands.push(cmdHelper.removeElementsFromList(element, containerElement, 'operator', null, [entry]));
      }

      return commands;
    },
    getExtensionElements: function(element) {
      return helper.getObjectList(element,'execution:Status');
    },
    hideExtensionElements: function(element, node) {
      return false;
    }
  });
  group.entries.push(operatorsEntry);

  // ID entry
  group.entries.push(entryFactory.validationAwareTextField({
    id: 'operator-id',
    label: translate('ID'),
    modelProperty: 'id',

    getProperty: function(element, node) {
      var object = getSelectedOperator(element, node) || {};
      return object.id;
    },

    setProperty: function(element, properties, node) {
      var object = getSelectedOperator(element, node);
      return cmdHelper.updateBusinessObject(element, object, properties);
    },

    hidden: function(element, node) {
      return !getSelectedOperator(element, node);
    },

    validate: function(element, values, node) {
      var object = getSelectedOperator(element, node);
      if (object) {
        var idValue = values.id;
        if (!idValue || idValue.trim() === '') {
          return { id: 'Id must not be empty.' };
        }
        var objects = helper.getObjectList(element,'execution:Status');
        var existingID = find(objects, function(f) {
          return f !== object && f.id === idValue;
        });
        if (existingID) {
          return { id: 'Id is already used.' };
        }
      }
    }
  }));


  // Select operator entry
  group.entries.push(entryFactory.selectBox({
    id: 'operator-name',
    label: translate('Status operator'),
    modelProperty : 'name',
    emptyParameter: false,
    selectOptions: statusOperators,
    get: function(element, node) {
      var object = getSelectedOperator(element, node) || {};
      return {
        name: object.name || statusOperators[0].name
      };
    },
    set: function(element, values, node) {
      var object = getSelectedOperator(element, node);
      return cmdHelper.updateBusinessObject(element, object, values);
    },
    hidden: function(element, node) {
      return !getSelectedOperator(element, node);
    },
  }));


  // Attribute box entry
  var attributesEntry = extensionElements(element, bpmnFactory, {
    id: 'attributes',
    label: translate('Attributes'),
    modelProperty: 'key',
    prefix: 'Attribute',
    createExtensionElement: function(element, extensionElement, value, node) {
      var operator = getSelectedOperator(element, node) || {}, commands = [];
      var attribute = elementHelper.createElement('execution:Attribute', { key: value }, operator, bpmnFactory);
      commands.push(cmdHelper.addElementsTolist(element, operator, 'attribute', [ attribute ]));

      return commands;
    },
    removeExtensionElement: function(element, extensionElement, value, idx, node) {
      var operator = getSelectedOperator(element, node) || {}, commands = [];
      commands.push(cmdHelper.removeElementsFromList(element, operator, 'attribute', null, [item]));
      return commands;
    },
    getExtensionElements: function(element, node) {
      var operator = getSelectedOperator(element, node) || {};
//console.log(operator);
      return operator.attribute || [];
    },
    hideExtensionElements: function(element, node) {
      return !getSelectedOperator(element, node);
    }
  });
  group.entries.push(attributesEntry);

  // Attribute key entry
  group.entries.push(entryFactory.validationAwareTextField({
    id: 'attribute-key',
    label: translate('Key'),
    modelProperty: 'key',

    getProperty: function(element, node) {
      var attribute = getSelectedAttribute(element, node) || {}; 
      return attribute.key;
    },

    setProperty: function(element, properties, node) {
      var attribute = getSelectedAttribute(element, node);
      return cmdHelper.updateBusinessObject(element, attribute, properties);
    },

    hidden: function(element, node) {
      return !getSelectedOperator(element, node) || !getSelectedAttribute(element, node);
    },

    validate: function(element, values, node) {
      var attribute = getSelectedAttribute(element, node) || {};
      if (attribute) {
        var keyValue = values.key;
        if (!keyValue || keyValue.trim() === '') {
          return { key: 'Key must not be empty.' };
        }
	var operator = getSelectedOperator(element, node) || {};
        var attributes = operator.attribute;
        var existingKey = find(attributes, function(f) {
          return f !== attribute && f.key === keyValue;
        });
        if (existingKey) {
          return { key: 'Key is already used.' };
        }
      }
    }
  }));

  // Select attribute type
  group.entries.push(entryFactory.selectBox({
    id: 'attribute-type',
    label: translate('Type'),
    modelProperty : 'type',
    emptyParameter: false,
    selectOptions: [
      { name: '<inherit>', value: '' },
      { name: 'string', value: 'xs:string' },
      { name: 'integer', value: 'xs:integer' },
      { name: 'decimal', value: 'xs:decimal' },
      { name: 'boolean', value: 'xs:boolean' }
    ],
    get: function(element, node) {
      var object = getSelectedAttribute(element, node) || {};
      return {
        type: object.type || ''
      };
    },
    set: function(element, properties, node) {
      if ( properties.type == '' ) properties.type = undefined;
      var attribute = getSelectedAttribute(element, node);
      return cmdHelper.updateBusinessObject(element, attribute, properties);
    },
    hidden: function(element, node) {
      return !getSelectedOperator(element, node) || !getSelectedAttribute(element, node);
    },
  }));

  /// Attribute value input field
  group.entries.push(entryFactory.textField({
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
      return !getSelectedOperator(element, node) || !getSelectedAttribute(element, node);
    }
  }));

};

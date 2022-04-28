'use strict';

var is = require('bpmn-js/lib/util/ModelUtil').is,
    getBO = require('bpmn-js/lib/util/ModelUtil').getBusinessObject,
    getBusinessObject =  function getBusinessObject(element) { return is(element, 'bpmn:Participant') ? getBO(element).processRef : getBO(element); };
var getExtensionElements = require('bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper').getExtensionElements,
    removeEntry = require('bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper').removeEntry,
    entryFactory = require('bpmn-js-properties-panel/lib/factory/EntryFactory'),
    elementHelper = require('bpmn-js-properties-panel/lib/helper/ElementHelper'),
    cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper'),
    is = require('bpmn-js/lib/util/ModelUtil').is,
    find = require('lodash/find');

var extensionElements = require('./ExtensionElements'), helper = require('./Helper');
var statusOperators = require('../operators.json');

module.exports = function(group, element, bpmnFactory, translate) {
  if ( !is(element, 'bpmn:Process') && !(is(element, 'bpmn:Participant') && getBO(element).get('processRef'))  && 
       !is(element, 'bpmn:Activity')
     ) {
    return;
  }

  if ( is(element, 'bpmn:Task') && ( getBusinessObject(element).type == "Request" || getBusinessObject(element).type == "Release") ) {
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
    return helper.getObject(element, selected.idx, 'execution:Operators');
  }

  function getSelectedParameter(element, node) {
      var operator = getSelectedOperator(element, node);
      if ( !operator ) return;
      var selected = parametersEntry.getSelected(element, node.parentNode);
      if (selected.idx === -1) {
        return;
      }
      return operator.parameter[selected.idx]
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
      var containerElement = helper.getContainerElement(element,'execution:Operators');
      if (!containerElement) {
        containerElement = elementHelper.createElement('execution:Operators', {}, extensionElement, bpmnFactory);
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
      var containerElement = helper.getContainerElement(element,'execution:Operators');
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
      return helper.getObjectList(element,'execution:Operators');
    },
    hideExtensionElements: function(element, node) {
      return false;
    }
  });
  group.entries.push(operatorsEntry);

  // ID entry
  group.entries.push(entryFactory.validationAwareTextField(translate, {
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
        var objects = helper.getObjectList(element,'execution:Operators');
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
  group.entries.push(entryFactory.selectBox(translate, {
    id: 'operator-name',
    label: translate('Status operator'),
    modelProperty : 'name',
    emptyParameter: false,
    selectOptions: statusOperators,
    get: function(element, node) {
      var object = getSelectedOperator(element, node) || {};
      return {
        name: object.name || statusOperators[0].value,
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

  // Attribute name entry
  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: 'operator-attribute',
    label: translate('Attribute name'),
    modelProperty: 'attribute',
    getProperty: function(element, node) {
      var object = getSelectedOperator(element, node) || {};
      return object.attribute;
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
        if (!values.attribute || values.attribute.trim() === '') {
          return { attribute: 'Attribute name must not be empty' };
        }
      }
    }
  }));

/*
  // Parameter box entry
  var parametersEntry = extensionElements(element, bpmnFactory, {
    id: 'parameters',
    label: translate('Parameters'),
    modelProperty: 'name',
    prefix: 'Parameter',
    createExtensionElement: function(element, extensionElement, value, node) {
      var operator = getSelectedOperator(element, node) || {}, commands = [];
      var parameter = elementHelper.createElement('execution:Parameter', { name: value }, operator, bpmnFactory);
      commands.push(cmdHelper.addElementsTolist(element, operator, 'parameter', [ parameter ]));

      return commands;
    },
    removeExtensionElement: function(element, extensionElement, value, idx, node) {
      var operator = getSelectedOperator(element, node) || {}, commands = [];
      commands.push(cmdHelper.removeElementsFromList(element, operator, 'parameter', null, [item]));
      return commands;
    },
    getExtensionElements: function(element, node) {
      var operator = getSelectedOperator(element, node) || {};
//console.log(operator);
      return operator.parameter || [];
    },
    hideExtensionElements: function(element, node) {
      return !getSelectedOperator(element, node);
    }
  });
  group.entries.push(parametersEntry);

  // Parameter name entry
  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: 'parameter-name',
    label: translate('Name'),
    modelProperty: 'name',

    getProperty: function(element, node) {
      var parameter = getSelectedParameter(element, node) || {}; 
      return parameter.name;
    },

    setProperty: function(element, properties, node) {
      var parameter = getSelectedParameter(element, node);
      return cmdHelper.updateBusinessObject(element, parameter, properties);
    },

    hidden: function(element, node) {
      return !getSelectedOperator(element, node) || !getSelectedParameter(element, node);
    },

    validate: function(element, values, node) {
      var parameter = getSelectedParameter(element, node) || {};
      if (parameter) {
        var parameterName = values.name;
        if (!parameterName || parameterName.trim() === '') {
          return { name: 'Name must not be empty.' };
        }
	var operator = getSelectedOperator(element, node) || {};
        var parameters = operator.parameter;
        var existingName = find(parameters, function(f) {
          return f !== parameter && f.name === name;
        });
        if (existingName) {
          return { existingName: 'Name is already used.' };
        }
      }
    }
  }));

  /// Parameter value input field
  group.entries.push(entryFactory.textField(translate, {
    id: 'parameter-value',
    label: translate('Value'),
    modelProperty: 'value',
    get: function(element, node) {
      var parameter = getSelectedParameter(element, node) || {}; 
      return { value: parameter.value };
    },

    set: function(element, properties, node) {
      var parameter = getSelectedParameter(element, node);
      return cmdHelper.updateBusinessObject(element, parameter, properties);
    },
    hidden: function(element, node) {
      return !getSelectedOperator(element, node) || !getSelectedParameter(element, node);
    }
  }));
*/

  // [FormData] form field constraints table
  group.entries.push(entryFactory.table(translate, {
    id: 'parameters',
    modelProperties: [ 'name', 'value' ],
    labels: [ translate('Name'), translate('Value') ],
    addLabel: translate('Parameters'),
    getElements: function(element, node) {
      var operator = getSelectedOperator(element, node) || {};
      return operator.parameter || [];
    },
    addElement: function(element, node) {
      var commands = [],
          operator = getSelectedOperator(element, node) || {};
      var parameter = elementHelper.createElement('execution:Parameter', { name: undefined, value: undefined }, operator, bpmnFactory);
      commands.push(cmdHelper.addElementsTolist(element, operator, 'parameter', [ parameter ]));

      return commands;
    },
    updateElement: function(element, value, node, idx) {
      var operator = getSelectedOperator(element, node) || {},
          parameter = operator.parameter[idx];

      value.name = value.name || undefined;
      value.value = value.value || undefined;

      return cmdHelper.updateBusinessObject(element, parameter, value);
    },
    removeElement: function(element, node, idx) {
      var commands = [],
          operator = getSelectedOperator(element, node),
          parameter = operator.parameter[idx];

      commands.push(cmdHelper.removeElementsFromList(
        element,
        operator,
        'parameter',
        null,
        [ parameter ]
      ));

      if (operator.parameter.length === 1) {
        // remove camunda:validation if the last existing constraint has been removed
        commands.push(cmdHelper.updateBusinessObject(element, operator, { parameter: undefined }));
      }

      return commands;
    },
    show: function(element, node) {
      return !!getSelectedOperator(element, node);
    }
  }));
/*
  // Parameter entry
  group.entries.push(entryFactory.table(translate, {
    id: 'parameters',
    labels: [ translate('Name'), translate('Value') ],
    modelProperties: [ 'name', 'value' ],
    show: function(element, node) {
      var selectedFormField = getSelectedOperator(element, node);

      return selectedFormField && selectedFormField.type === 'enum';
    },
    getElements: function(element, node) {
      var selectedFormField = getSelectedOperator(element, node);

      return formHelper.getEnumValues(selectedFormField);
    },
    addElement: function(element, node) {
      var selectedFormField = getSelectedOperator(element, node),
          id = generateValueId();

      var enumValue = elementHelper.createElement(
        'execution:Parameter',
        { name: undefined, value: undefined },
        getBusinessObject(element),
        bpmnFactory
      );

      return cmdHelper.addElementsTolist(element, selectedFormField, 'values', [enumValue]);
    },
    removeElement: function(element, node, idx) {
      var selectedFormField = getSelectedOperator(element, node),
          enumValue = selectedFormField.values[idx];

      return cmdHelper.removeElementsFromList(element, selectedFormField, 'values', null, [enumValue]);
    },
    updateElement: function(element, value, node, idx) {
      var selectedFormField = getSelectedOperator(element, node),
          enumValue = selectedFormField.values[idx];

      value.name = value.name || undefined;
      return cmdHelper.updateBusinessObject(element, enumValue, value);
    },
    validate: function(element, value, node, idx) {

      var selectedFormField = getSelectedOperator(element, node),
          enumValue = selectedFormField.values[idx];

      if (enumValue) {
        // check if id is valid
        var validationError = utils.isIdValid(enumValue, value.id, translate);

        if (validationError) {
          return { id: validationError };
        }
      }
    }
  }));

*/
};

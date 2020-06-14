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


module.exports = function(group, element, bpmnFactory, translate) {

  if ( !is(element, 'bpmn:FlowNode') && !is(element, 'bpmn:SequenceFlow') ) {
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
  function getSelectedObject(element, node) {
    var selected = selectEntry.getSelected(element, node.parentNode);
    if (selected.idx === -1) {
      return;
    }
    return helper.getObject(element, selected.idx, 'execution:Restrictions');
  }

  // Select box entry
  var selectEntry = extensionElements(element, bpmnFactory, {
    id: 'restriction',
    label: translate('Restrictions'),
    modelProperty: 'id',
    prefix: 'Restriction',
    createExtensionElement: function(element, extensionElement, value) {
      var bo = getBusinessObject(element), commands = [];

      if (!extensionElement) {
        if (is(element, 'bpmn:Participant')) {
          extensionElement = participant.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
        }
        else {
          extensionElement = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
        }
        commands.push(cmdHelper.updateProperties(element, { extensionElements: extensionElement }));
      }
      var containerElement = helper.getContainerElement(element,'execution:Restrictions');
      if (!containerElement) {
        containerElement = elementHelper.createElement('execution:Restrictions', {}, extensionElement, bpmnFactory);
        commands.push(cmdHelper.addAndRemoveElementsFromList(
          element,
          extensionElement,
          'values',
          'extensionElements',
          [containerElement],
          []
        ));
      }

      var restriction = elementHelper.createElement('execution:Restriction', { id: value }, containerElement, bpmnFactory);
        commands.push(cmdHelper.addElementsTolist(element, containerElement, 'restriction', [ restriction ]));

      return commands;
    },
    removeExtensionElement: function(element, extensionElement, value, idx) {
      var containerElement = helper.getContainerElement(element,'execution:Restrictions');
      var entry = containerElement.restriction[idx],
          commands = [];

      if (containerElement.restriction.length < 2) {
        commands.push(removeEntry(getBusinessObject(element), element, containerElement));
      } else {
        commands.push(cmdHelper.removeElementsFromList(element, containerElement, 'restriction', null, [entry]));
      }

      return commands;
    },
    getExtensionElements: function(element) {
      return helper.getObjectList(element,'execution:Restrictions');
    },
    hideExtensionElements: function(element, node) {
      return false;
    }
  });
  group.entries.push(selectEntry);

  // ID entry
  group.entries.push(entryFactory.validationAwareTextField({
    id: 'restriction-id',
    label: translate('ID'),
    modelProperty: 'id',

    getProperty: function(element, node) {
      var object = getSelectedObject(element, node) || {};
      return object.id;
    },

    setProperty: function(element, properties, node) {
      var object = getSelectedObject(element, node);
      return cmdHelper.updateBusinessObject(element, object, properties);
    },

    hidden: function(element, node) {
      return !getSelectedObject(element, node);
    },

    validate: function(element, values, node) {
      var object = getSelectedObject(element, node);
      if (object) {
        var idValue = values.id;
        if (!idValue || idValue.trim() === '') {
          return { id: 'Id must not be empty.' };
        }
        var objects = helper.getObjectList(element,'execution:Restrictions');
        var existingID = find(objects, function(f) {
          return f !== object && f.id === idValue;
        });
        if (existingID) {
          return { id: 'Id is already used.' };
        }
      }
    }
  }));

  // Attribute key entry
  group.entries.push(entryFactory.validationAwareTextField({
    id: 'restriction-attribute',
    label: translate('Attribute key'),
    modelProperty: 'attribute',

    getProperty: function(element, node) {
      var object = getSelectedObject(element, node) || {};
      return object.attribute;
    },

    setProperty: function(element, properties, node) {
      var object = getSelectedObject(element, node);
      return cmdHelper.updateBusinessObject(element, object, properties);
    },

    hidden: function(element, node) {
      return !getSelectedObject(element, node);
    },

    validate: function(element, values, node) {
      var object = getSelectedObject(element, node);
      if (object) {
        var attributeKey = values.attribute;
        if (!attributeKey || attributeKey.trim() === '') {
          return { attribute: 'Attribute key must not be empty' };
        }
      }
    }
  }));

  // minInclusive input field
  group.entries.push(entryFactory.textField({
    id: 'restriction-mininclusive',
    label: translate('Value must be larger or equal to'),
    modelProperty: 'minInclusive',
    get: function(element, node) {
      var object = getSelectedObject(element, node) || {},
          values = {};
      var minInclusive = object['minInclusive'];
      if ( minInclusive ) {
	values['minInclusive'] = minInclusive[0].value;
      }
      return values;
    },
    set: function(element, values, node) {
      var commands = [],
          object = getSelectedObject(element, node),
          minInclusive = object.minInclusive;
      if (!minInclusive) {
        // create <minInclusive> element
        minInclusive = elementHelper.createElement('execution:MinInclusive', { 'value': values['minInclusive'] }, getBusinessObject(element), bpmnFactory);
        commands.push(cmdHelper.addElementsTolist(element, object, 'minInclusive', minInclusive));
      }
      return commands;
    },
    hidden: function(element, node) {
      return !getSelectedObject(element, node);
    }
  }));

  // maxInclusive input field
  group.entries.push(entryFactory.textField({
    id: 'restriction-maxinclusive',
    label: translate('Value must be smaller or equal to'),
    modelProperty: 'maxInclusive',
    get: function(element, node) {
      var object = getSelectedObject(element, node) || {},
          values = {};
      var maxInclusive = object['maxInclusive'];
      if ( maxInclusive ) {
	values['maxInclusive'] = maxInclusive[0].value;
      }
      return values;
    },
    set: function(element, values, node) {
      var commands = [],
          object = getSelectedObject(element, node),
          maxInclusive = object.maxInclusive;
      if (!maxInclusive) {
        // create <maxInclusive> element
        maxInclusive = elementHelper.createElement('execution:MaxInclusive', { 'value': values['maxInclusive'] }, getBusinessObject(element), bpmnFactory);
       commands.push(cmdHelper.addElementsTolist(element, object, 'maxInclusive', maxInclusive));
      }
      return commands;
    },
    hidden: function(element, node) {
      return !getSelectedObject(element, node);
    }
  }));

  // Enumeration list entry
  group.entries.push(entryFactory.table({
    id: 'enumeration-list',
    modelProperties: [ 'value' ],
    labels: [ translate('Value') ],
    addLabel: translate('Add allowed value'),
    getElements: function(element, node) {
      var object = getSelectedObject(element, node);
      return object ? object.enumeration : [];
    },
    addElement: function(element, node) {
      var commands = [],
          object = getSelectedObject(element, node);
      var bo = getBusinessObject(element);
      var newEnumerationValue = elementHelper.createElement('execution:Enumeration', { value: undefined }, object, bpmnFactory);
      commands.push(cmdHelper.addElementsTolist(element, object, 'enumeration', newEnumerationValue ));
      return commands;
    },
    updateElement: function(element, data, node, idx) {
      var object = getSelectedObject(element, node),
          item = object.enumeration[idx];
      data.value = data.value || undefined;
      return cmdHelper.updateBusinessObject(element, item, data);
    },
    removeElement: function(element, node, idx) {
      var commands = [],
          object = getSelectedObject(element, node),
          item = object.enumeration[idx];
      commands.push(cmdHelper.removeElementsFromList(
        element,
        object,
        'enumeration',
        null,
        [ item ]
      ));
      return commands;
    },
    show: function(element, node) {
      return !!getSelectedObject(element, node);
    }
  }));

  // Negate entry
  var negateEntry = entryFactory.checkbox({
    id: 'restriction-negate',
    label: translate('Negate restriction'),
    modelProperty: 'negate',
    get: function(element, node) {
      var object = getSelectedObject(element, node) || {},
          values = {};
      values['negate'] = object['negate'];
      return values;
    },
    set: function(element, values, node) {
      var commands = [];
      var object = getSelectedObject(element, node),
          properties = {};
      properties['negate'] = values['negate'] || undefined;
      commands.push(cmdHelper.updateBusinessObject(element, object, properties));
      return commands;
    },
    hidden: function(element, node) {
      return !getSelectedObject(element, node);
    }
  });
  group.entries.push(negateEntry);


};

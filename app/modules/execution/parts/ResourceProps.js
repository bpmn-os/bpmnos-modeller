'use strict';


var is = require('bpmn-js/lib/util/ModelUtil').is,
    getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;

var getExtensionElements = require('bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper').getExtensionElements,
    removeEntry = require('bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper').removeEntry,
    entryFactory = require('bpmn-js-properties-panel/lib/factory/EntryFactory'),
    elementHelper = require('bpmn-js-properties-panel/lib/helper/ElementHelper'),
    cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper'),
    utils = require('bpmn-js-properties-panel/lib/Utils'),
    find = require('lodash/find');

var extensionElements = require('./ExtensionElements'), helper = require('./Helper');
var consolidators = require('../consolidators.json');



module.exports = function(group, element, bpmnFactory, translate) {

  if ( !is(element, 'bpmn:Task') || getBusinessObject(element).type != "Resource" ) {
    return;
  }

  function getSelectedObject(element, node) {
    var selected = capabilitiesEntry.getSelected(element, node.parentNode);
    if (selected.idx === -1) {
      return;
    }
    return helper.getObject(element, selected.idx, 'execution:Capabilities');
  }

/*
  // Persist entry
  var persistEntry = entryFactory.checkbox(translate, {
    id: 'persist',
    label: translate('Persist'),
    modelProperty: 'persist',
    get: function(element, node) {
      var attrs = getBusinessObject(element)['$attrs'];
      var persist = attrs.persist;
      if ( persist == undefined ) persist = true;
      return { persist: persist };
    }
  });
  group.entries.push(persistEntry);
*/

  /// Default process entry
  group.entries.push(entryFactory.textField(translate, {
    id: 'default',
    label: translate('Default process Id'),
    modelProperty: 'execution:default',
  }));
  /// Preparation process entry
  group.entries.push(entryFactory.textField(translate, {
    id: 'prepare',
    label: translate('Preparation process Id'),
    modelProperty: 'execution:prepare',
  }));
  /// Service process entry
  group.entries.push(entryFactory.textField(translate, {
    id: 'service',
    label: translate('Service process Id'),
    modelProperty: 'execution:service',
  }));

  /// Finishing process entry
  group.entries.push(entryFactory.textField(translate, {
    id: 'finish',
    label: translate('Finishing process Id'),
    modelProperty: 'execution:finish',
  }));

  //////////////////////
  // Capabilities entry
  //////////////////////

  // Capabilities
  var capabilitiesEntry = extensionElements(element, bpmnFactory, {
    id: 'capabilities',
    label: translate('Capabilities'),
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
      var containerElement = helper.getContainerElement(element,'execution:Capabilities');
      if (!containerElement) {
        containerElement = elementHelper.createElement('execution:Capabilities', {}, extensionElement, bpmnFactory);
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
      var containerElement = helper.getContainerElement(element,'execution:Capabilities');
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
      return helper.getObjectList(element,'execution:Capabilities');
    },
    hideExtensionElements: function(element, node) {
      return false;
    }
  });
  group.entries.push(capabilitiesEntry);

  // ID entry
  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: 'capability-id',
    label: translate('Id'),
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

  // Key entry
  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: 'capability-key',
    label: translate('Key'),
    modelProperty: 'key',

    getProperty: function(element, node) {
      var object = getSelectedObject(element, node) || {};
      return object.key;
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
        if (!values.key || values.key.trim() === '') {
          return { key: 'Key name must not be empty' };
        }
      }
    }
  }));

  // minInclusive input field
  group.entries.push(entryFactory.textField(translate, {
    id: 'capability-mininclusive',
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
      if (minInclusive) {
        // delete <minInclusive> element
        commands.push(cmdHelper.removeElementsFromList(element, object, 'minInclusive', null, minInclusive));
      }
      if ( values['minInclusive'] ) {
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
  group.entries.push(entryFactory.textField(translate, {
    id: 'capability-maxinclusive',
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
      if (maxInclusive) {
        // delete <maxInclusive> element
        commands.push(cmdHelper.removeElementsFromList(element, object, 'maxInclusive', null, maxInclusive));
      }
      if ( values['maxInclusive'] ) {
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
  group.entries.push(entryFactory.table(translate, {
    id: 'capability-enumeration-list',
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

/*
  // Negate entry
  var negateEntry = entryFactory.checkbox(translate, {
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
*/

  // Select consolidator entry
  group.entries.push(entryFactory.selectBox(translate, {
    id: 'consolidator-name',
    label: translate('Consolidator'),
    modelProperty : 'name',
    emptyParameter: false,
    selectOptions: consolidators,
    get: function(element, node) {
      // get consolidator in element
      var bo = getBusinessObject(element);
      var consolidator = helper.getContainerElement(bo, 'execution:Consolidator') || {};
console.log( (consolidator.$attrs || {}).name || consolidators[0].value);
      return {
        name: (consolidator.$attrs || {}).name || consolidators[0].value
      };
    },
    set: function(element, values, node) {
console.log(consolidators,values);
      var bo = getBusinessObject(element);
      var consolidator = helper.getContainerElement(bo, 'execution:Consolidator')
      if ( values.name == "none" ) {
	return removeEntry(bo, element, consolidator);
      }
      var commands = [];
      var extensionElement = bo.get('extensionElements');
      if ( !extensionElement ) {
          extensionElement = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
          commands.push(cmdHelper.updateProperties(element, { extensionElements: extensionElement }));
      }

      if ( !consolidator ) {
        consolidator = elementHelper.createElement('execution:Consolidator', { name: "none"}, extensionElement, bpmnFactory);
console.log(consolidator);

        commands.push(cmdHelper.addAndRemoveElementsFromList(
          element,
          extensionElement,
          'values',
          'extensionElements',
          [consolidator],
          []
        ));
      }

      commands.push( cmdHelper.updateBusinessObject(element, consolidator, values) );
      return commands;
    },
    hidden: function(element, node) {
      return false;
    },
  }));

/*
  // Select consolidator group entry
*/

};

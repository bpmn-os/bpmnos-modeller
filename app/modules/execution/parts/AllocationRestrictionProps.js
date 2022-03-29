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


module.exports = function(group, element, bpmnFactory, translate) {

  if ( !is(element, 'bpmn:Task') || getBusinessObject(element).type != "Resource" ) {
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
    if (selected.idx === -1 || selected.idx == undefined) {
      return;
    }
    var allocationElement = helper.getContainerElement(element, 'execution:Allocations');

    var restriction = undefined;
    if ( allocationElement && allocationElement.restrictions ) {
	restriction = allocationElement.restrictions[0].restriction[selected.idx]; 
    }
    return restriction;
  }

  // Select box entry
  var selectEntry = extensionElements(element, bpmnFactory, {
    id: 'allocation-restriction',
    label: translate('Restrictions'),
    modelProperty: 'id',
    prefix: 'Restriction',
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
      if ( allocationElement.restrictions ) containerElement = allocationElement.restrictions[0];

      if (!containerElement) {
        containerElement = elementHelper.createElement('execution:Restrictions', {}, allocationElement, bpmnFactory);
        commands.push(cmdHelper.addElementsTolist(element, allocationElement, 'restrictions', [ containerElement ]));
      }

      var restriction = elementHelper.createElement('execution:Restriction', { id: value }, containerElement, bpmnFactory);
        commands.push(cmdHelper.addElementsTolist(element, containerElement, 'restriction', [ restriction ]));

      return commands;
    },
    removeExtensionElement: function(element, extensionElement, value, idx) {
      var containerElement = helper.getContainerElement(element,'execution:Allocations').restrictions[0];
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
      var allocationElement = helper.getContainerElement(element,'execution:Allocations');
      if (allocationElement && allocationElement.restrictions && allocationElement.restrictions.length) {
	      return allocationElement.restrictions[0].restriction;	
      }
      return [];
    },
    hideExtensionElements: function(element, node) {
      return false;
    }
  });
  group.entries.push(selectEntry);

  // ID entry
  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: 'allocation-restriction-id',
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

  // Attribute name entry
  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: 'allocation-restriction-attribute',
    label: translate('Attribute name'),
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
        if (!values.attribute || values.attribute.trim() === '') {
          return { attribute: 'Attribute name must not be empty' };
        }
      }
    }
  }));

  // Required entry
  var requiredEntry = entryFactory.checkbox(translate, {
    id: 'allocation-restriction-required',
    label: translate('Value is required'),
    modelProperty: 'required',
    get: function(element, node) {
      var object = getSelectedObject(element, node) || {},
          values = {};
      values['required'] = object['required'];
      return values;
    },
    set: function(element, values, node) {
      var commands = [];
      var object = getSelectedObject(element, node),
          properties = {};
      properties['required'] = values['required'] || undefined;
      commands.push(cmdHelper.updateBusinessObject(element, object, properties));
      return commands;
    },
    hidden: function(element, node) {
      return !getSelectedObject(element, node);
    }
  });
  group.entries.push(requiredEntry);

  // minInclusive input field
  group.entries.push(entryFactory.textField(translate, {
    id: 'allocation-restriction-mininclusive',
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
    id: 'allocation-restriction-maxinclusive',
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
    id: 'allocation-enumeration-list',
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
  var negateEntry = entryFactory.checkbox(translate, {
    id: 'allocation-restriction-negate',
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

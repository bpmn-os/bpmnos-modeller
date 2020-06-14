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
  if ( !is(element, 'bpmn:Process') && !(is(element, 'bpmn:Participant') && getBO(element).get('processRef')) && !is(element, 'bpmn:SubProcess')  ) {
    return;
  }

  function getSelectedAttribute(element, node) {
    var selected = attributesEntry.getSelected(element, node.parentNode);
    if (selected.idx === -1) {
      return;
    }
    return helper.getObject(element, selected.idx, 'execution:Status');
  }

  function getSelectedRestriction(element, node) {
    var selected = restrictionsEntry.getSelected(element, node.parentNode);
    if (selected.idx === -1) {
      return;
    }
    return helper.getObject(element, selected.idx, 'execution:Restrictions');
  }

  // Process id entry
  group.entries.push(entryFactory.validationAwareTextField({
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
  group.entries.push(entryFactory.validationAwareTextField({
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

  // Attributes entry
  var attributesEntry = extensionElements(element, bpmnFactory, {
    id: 'attribute',
    label: translate('Attributes'),
    modelProperty: 'key',
    prefix: 'Attribute',
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

      var attribute = elementHelper.createElement('execution:Attribute', { key: value, type: 'xs:string' }, containerElement, bpmnFactory);
        commands.push(cmdHelper.addElementsTolist(element, containerElement, 'attribute', [ attribute ]));

      return commands;
    },
    removeExtensionElement: function(element, extensionElement, value, idx) {
      var containerElement = helper.getContainerElement(element,'execution:Status');
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
      return helper.getObjectList(element,'execution:Status');
    },
    hideExtensionElements: function(element, node) {
      return false;
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
      return !getSelectedAttribute(element, node);
    },

    validate: function(element, values, node) {
      var attribute = getSelectedAttribute(element, node) || {};
      if (attribute) {
        var keyValue = values.key;
        if (!keyValue || keyValue.trim() === '') {
          return { key: 'Key must not be empty.' };
        }
        var attributes = helper.getObjectList(element,'execution:Status')
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
      return !getSelectedAttribute(element, node);
    }
  }));

  // Restrictions entry
  var restrictionsEntry = extensionElements(element, bpmnFactory, {
    id: 'restriction',
    label: translate('Restrictions'),
    modelProperty: 'id',
    prefix: 'Restriction',
    createExtensionElement: function(element, extensionElement, value) {
      var bo = getBusinessObject(element), commands = [];

      if (!extensionElement) {
        extensionElement = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
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
  group.entries.push(restrictionsEntry);

  // ID entry
  group.entries.push(entryFactory.validationAwareTextField({
    id: 'restriction-id',
    label: translate('ID'),
    modelProperty: 'id',

    getProperty: function(element, node) {
      var object = getSelectedRestriction(element, node) || {};
      return object.id;
    },

    setProperty: function(element, properties, node) {
      var object = getSelectedRestriction(element, node);
      return cmdHelper.updateBusinessObject(element, object, properties);
    },

    hidden: function(element, node) {
      return !getSelectedRestriction(element, node);
    },

    validate: function(element, values, node) {
      var object = getSelectedRestriction(element, node);
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
      var object = getSelectedRestriction(element, node) || {};
      return object.attribute;
    },

    setProperty: function(element, properties, node) {
      var object = getSelectedRestriction(element, node);
      return cmdHelper.updateBusinessObject(element, object, properties);
    },

    hidden: function(element, node) {
      return !getSelectedRestriction(element, node);
    },

    validate: function(element, values, node) {
      var object = getSelectedRestriction(element, node);
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
      var object = getSelectedRestriction(element, node) || {},
          values = {};
      var minInclusive = object['minInclusive'];
      if ( minInclusive ) {
	values['minInclusive'] = minInclusive[0].value;
      }
      return values;
    },
    set: function(element, values, node) {
      var commands = [],
          object = getSelectedRestriction(element, node),
          minInclusive = object.minInclusive;
      if (!minInclusive) {
        // create <minInclusive> element
        minInclusive = elementHelper.createElement('execution:MinInclusive', { 'value': values['minInclusive'] }, getBusinessObject(element), bpmnFactory);
        commands.push(cmdHelper.addElementsTolist(element, object, 'minInclusive', minInclusive));
      }
      return commands;
    },
    hidden: function(element, node) {
      return !getSelectedRestriction(element, node);
    }
  }));

  // maxInclusive input field
  group.entries.push(entryFactory.textField({
    id: 'restriction-maxinclusive',
    label: translate('Value must be smaller or equal to'),
    modelProperty: 'maxInclusive',
    get: function(element, node) {
      var object = getSelectedRestriction(element, node) || {},
          values = {};
      var maxInclusive = object['maxInclusive'];
      if ( maxInclusive ) {
	values['maxInclusive'] = maxInclusive[0].value;
      }
      return values;
    },
    set: function(element, values, node) {
      var commands = [],
          object = getSelectedRestriction(element, node),
          maxInclusive = object.maxInclusive;
      if (!maxInclusive) {
        // create <maxInclusive> element
        maxInclusive = elementHelper.createElement('execution:MaxInclusive', { 'value': values['maxInclusive'] }, getBusinessObject(element), bpmnFactory);
       commands.push(cmdHelper.addElementsTolist(element, object, 'maxInclusive', maxInclusive));
      }
      return commands;
    },
    hidden: function(element, node) {
      return !getSelectedRestriction(element, node);
    }
  }));

  // Enumeration list entry
  group.entries.push(entryFactory.table({
    id: 'enumeration-list',
    modelProperties: [ 'value' ],
    labels: [ translate('Value') ],
    addLabel: translate('Add allowed value'),
    getElements: function(element, node) {
      var object = getSelectedRestriction(element, node);
      return object ? object.enumeration : [];
    },
    addElement: function(element, node) {
      var commands = [],
          object = getSelectedRestriction(element, node);
      var bo = getBusinessObject(element);
      var newEnumerationValue = elementHelper.createElement('execution:Enumeration', { value: undefined }, object, bpmnFactory);
      commands.push(cmdHelper.addElementsTolist(element, object, 'enumeration', newEnumerationValue ));
      return commands;
    },
    updateElement: function(element, data, node, idx) {
      var object = getSelectedRestriction(element, node),
          item = object.enumeration[idx];
      data.value = data.value || undefined;
      return cmdHelper.updateBusinessObject(element, item, data);
    },
    removeElement: function(element, node, idx) {
      var commands = [],
          object = getSelectedRestriction(element, node),
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
      return !!getSelectedRestriction(element, node);
    }
  }));

  // Negate entry
  var negateEntry = entryFactory.checkbox({
    id: 'restriction-negate',
    label: translate('Negate restriction'),
    modelProperty: 'negate',
    get: function(element, node) {
      var object = getSelectedRestriction(element, node) || {},
          values = {};
      values['negate'] = object['negate'];
      return values;
    },
    set: function(element, values, node) {
      var commands = [];
      var object = getSelectedRestriction(element, node),
          properties = {};
      properties['negate'] = values['negate'] || undefined;
      commands.push(cmdHelper.updateBusinessObject(element, object, properties));
      return commands;
    },
    hidden: function(element, node) {
      return !getSelectedRestriction(element, node);
    }
  });
  group.entries.push(negateEntry);


};

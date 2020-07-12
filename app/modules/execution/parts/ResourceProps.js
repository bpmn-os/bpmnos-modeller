'use strict';

var is = require('bpmn-js/lib/util/ModelUtil').is;

var removeEntry = require('bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper').removeEntry,
    entryFactory = require('bpmn-js-properties-panel/lib/factory/EntryFactory'),
    elementHelper = require('bpmn-js-properties-panel/lib/helper/ElementHelper'),
    cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper'),
    utils = require('bpmn-js-properties-panel/lib/Utils'),
    find = require('lodash/find');

var resourceElements = require('./ResourceElements'), 
    resourceHelper = require('./ResourceHelper'),
    extensionElements = require('./ExtensionElements'),
    helper = require('./Helper');

module.exports = function(group, element, bpmnFactory, translate) {
  function getSelectedResource(element, node) {
    var selected = resourcesEntry.getSelected(element, node.parentNode);
//console.warn("Selected",selected);
    if (selected.idx === -1) {
      return;
    }
    return resourceHelper.getResource(selected.value);
  }

  function getContainerElement(resource, type) {
    if ( !resource.extensionElements ) return;
//console.warn(resource.extensionElements.values, type);
    return  resource.extensionElements.values.find( function(e) { return e.$type == type; } );
  }

  function getSelectedRestriction(element, node) {
    var resource = getSelectedResource(element,node) || {};
    var restrictions = getContainerElement(resource, 'execution:Restrictions') || {}; 
    var selected = restrictionsEntry.getSelected(element, node.parentNode);
    if (!resource || !restrictions.restriction || selected.idx === -1) {
      return;
    }
    return restrictions.restriction[selected.idx];
  }

  function getSelectedAttribute(element, node, type) {
    var resource = getSelectedResource(element,node) || {};
    var attributes = getContainerElement(resource, type) || {};
    var entry = (type == 'execution:Status') ? statusEntry : contextEntry;  
    var selected = entry.getSelected(element, node.parentNode);
//console.warn(resource ,attributes.attribute,  selected.idx);
    if (!resource || !attributes.attribute || selected.idx === -1) {
      return;
    }
    return attributes.attribute[selected.idx];
  }


  // Resources entry
  var resourcesEntry = resourceElements(element, bpmnFactory, {
    id: 'resources',
    label: translate('Resources'),
    modelProperty: 'id',
    prefix: 'Resource',
    createExtensionElements: function(element, extensionElement, value) {
//console.warn("ResourceProps:createExtensionElements",extensionElement,value);
      var commands = [];
// Customize extension element
      return commands;
    },
    removeExtensionElements: function(element, extensionElement, value, idx) {
//console.warn("ResourceProps:removeExtensionElements",value,idx);
	return [];
    },
/*
    onSelectionChange: function(element, node, event, scope) {
console.log("onSelectionChange",element, node, event, scope);
      return;
    },
*/
  });
  group.entries.push(resourcesEntry);

  // Resource ID entry
  group.entries.push(entryFactory.validationAwareTextField({
    id: 'resource-id',
    label: translate('Resource Id'),
    modelProperty: 'id',

    getProperty: function(element, node) {
//console.warn("getProperty");
      var resource = getSelectedResource(element, node) || {}; 
      return resource.id;
    },

    setProperty: function(element, properties, node) {
//console.warn("setProperty");
      var resource = getSelectedResource(element, node);
      return cmdHelper.updateBusinessObject(element, resource, properties);
    },

    hidden: function(element, node) {
//console.warn("hidden");
      return !getSelectedResource(element, node);
    },

    validate: function(element, values, node) {
      var resource = getSelectedResource(element, node) || {};
      if (resource) {
        var IdValue = values.id;
        if (!IdValue || IdValue.trim() === '') {
          return { id: 'Id must not be empty.' };
        }
        var resources = resourceHelper.getResources();
        var existingId = find(resources, function(f) {
          return f !== resource && f.id === IdValue;
        });
        if (existingId) {
          return { id: 'Id is already used.' };
        }
      }
    }
  }));

  /// Preparation process entry
  group.entries.push(entryFactory.textField({
    id: 'prepare',
    label: translate('Preparation process Id'),
    modelProperty: 'execution:prepare',
    get: function(element, node) {
      var content = getSelectedResource(element, node) || {}; 
      return { 'execution:prepare': content.prepare };
    },
    set: function(element, properties, node) {
      var content = getSelectedResource(element, node);
      return cmdHelper.updateBusinessObject(element, content, properties);
    },
    hidden: function(element, node) {
      return !getSelectedResource(element, node);
    }
  }));

  /// Service process entry
  group.entries.push(entryFactory.textField({
    id: 'service',
    label: translate('Service process Id'),
    modelProperty: 'execution:service',
    get: function(element, node) {
      var content = getSelectedResource(element, node) || {}; 
      return { 'execution:service': content.service };
    },
    set: function(element, properties, node) {
      var content = getSelectedResource(element, node);
      return cmdHelper.updateBusinessObject(element, content, properties);
    },
    hidden: function(element, node) {
      return !getSelectedResource(element, node);
    }
  }));

  /// Finishing process entry
  group.entries.push(entryFactory.textField({
    id: 'finish',
    label: translate('Finishing process Id'),
    modelProperty: 'execution:finish',
    get: function(element, node) {
      var content = getSelectedResource(element, node) || {}; 
      return { 'execution:finish': content.finish };
    },
    set: function(element, properties, node) {
      var content = getSelectedResource(element, node);
      return cmdHelper.updateBusinessObject(element, content, properties);
    },
    hidden: function(element, node) {
      return !getSelectedResource(element, node);
    }
  }));

  //////////////////////
  // Status entry
  //////////////////////

  // Attributes entry
  var statusEntry = extensionElements(element, bpmnFactory, {
    id: 'status',
    label: translate('Status attributes'),
    modelProperty: 'key',
    prefix: 'Attribute',
    createExtensionElement: function(element, extensionElement, value, node) {
      var commands = [];
      var resource = getSelectedResource(element, node);
//console.warn(extensionElement);
      extensionElement = resource.extensionElements;
      if ( !extensionElement ) {
        extensionElement = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, resource, bpmnFactory);
        commands.push(cmdHelper.updateBusinessObject( resource, resource, { extensionElements: extensionElement }));
      }
      var containerElement = getContainerElement(resource,'execution:Status');
      if (!containerElement) {
        containerElement = elementHelper.createElement('execution:Status', {}, extensionElement, bpmnFactory);
        commands.push(cmdHelper.addAndRemoveElementsFromList(
          resource,
          extensionElement,
          'values',
          'extensionElements',
          [containerElement],
          []
        ));
      }
      var attribute = elementHelper.createElement('execution:Attribute', { key: value, type: 'xs:string' }, containerElement, bpmnFactory);
      commands.push(cmdHelper.addElementsTolist(resource, containerElement, 'attribute', [ attribute ]));

      return commands;
    },
    removeExtensionElement: function(element, extensionElement, value, idx, node) {
      var commands = [];
      var resource = getSelectedResource(element, node) || {};
      var extensionElement = resource.extensionElements;
      if ( !extensionElement ) return;
      var containerElement = getContainerElement(resource,'execution:Status') || {};
      var item = containerElement.attribute[idx];
//console.warn(containerElement);
      if (containerElement.attribute.length < 2) {
        commands.push(removeEntry(resource, extensionElement, containerElement));
      } else {
        commands.push(cmdHelper.removeElementsFromList(resource, containerElement, 'attribute', null, [item]));
      }

      return commands;
    },
    getExtensionElements: function(element, node) {
      var resource = getSelectedResource(element, node) || {};
      var extensionElement = resource.extensionElements;
      if ( !extensionElement ) return;
      var containerElement = getContainerElement(resource,'execution:Status') || {};
      return containerElement.attribute;
    },
    hideExtensionElements: function(element, node) {
      return !getSelectedResource(element, node);
    }
  });
  group.entries.push(statusEntry);

  // Attribute key entry
  group.entries.push(entryFactory.validationAwareTextField({
    id: 'status-attribute-key',
    label: translate('Key'),
    modelProperty: 'key',

    getProperty: function(element, node) {
      var attribute = getSelectedAttribute(element, node, 'execution:Status') || {}; 
      return attribute.key;
    },

    setProperty: function(element, properties, node) {
      var attribute = getSelectedAttribute(element, node, 'execution:Status');
      return cmdHelper.updateBusinessObject(element, attribute, properties);
    },

    hidden: function(element, node) {
      return !getSelectedAttribute(element, node, 'execution:Status');
    },

    validate: function(element, values, node) {
      var attribute = getSelectedAttribute(element, node, 'execution:Status') || {};
      if (attribute) {
        var keyValue = values.key;
        if (!keyValue || keyValue.trim() === '') {
          return { key: 'Key must not be empty.' };
        }
        var resource = getSelectedResource(element, node) || {};
        var attributes = (getContainerElement(resource, 'execution:Status') || {}).attribute;
        var existingKey = find(attributes, function(f) {
          return f !== attribute && f.key === keyValue;
        });
        if (existingKey) {
          return { key: 'Key is already used.' };
        }
      }
    }
  }));
///

  // Select attribute type
  group.entries.push(entryFactory.selectBox({
    id: 'send-attribute-type',
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
      var object = getSelectedAttribute(element, node, 'execution:Status') || {};
      return {
        type: object.type || 'xs:string'
      };
    },
    set: function(element, properties, node) {
console.log(properties);
//      if ( properties.type == '' ) properties.type = 'xs:string';
      var attribute = getSelectedAttribute(element, node, 'execution:Status');
      return cmdHelper.updateBusinessObject(element, attribute, properties);
    },
    hidden: function(element, node) {
      return !getSelectedAttribute(element, node, 'execution:Status');
    },
  }));

  /// Attribute value input field
  group.entries.push(entryFactory.textField({
    id: 'send-attribute-value',
    label: translate('Value'),
    modelProperty: 'value',
    get: function(element, node) {
      var attribute = getSelectedAttribute(element, node, 'execution:Status') || {}; 
      return { value: attribute.value };
    },

    set: function(element, properties, node) {
      var attribute = getSelectedAttribute(element, node, 'execution:Status');
      return cmdHelper.updateBusinessObject(element, attribute, properties);
    },
    hidden: function(element, node) {
      return !getSelectedAttribute(element, node, 'execution:Status');
    }
  }));

  //////////////////////
  // Context entry
  //////////////////////

  // Attributes entry
  var contextEntry = extensionElements(element, bpmnFactory, {
    id: 'context',
    label: translate('Context attributes'),
    modelProperty: 'key',
    prefix: 'Attribute',
    createExtensionElement: function(element, extensionElement, value, node) {
      var commands = [];
      var resource = getSelectedResource(element, node);
//console.warn(extensionElement);
      extensionElement = resource.extensionElements;
      if ( !extensionElement ) {
        extensionElement = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, resource, bpmnFactory);
        commands.push(cmdHelper.updateBusinessObject( resource, resource, { extensionElements: extensionElement }));
      }
      var containerElement = getContainerElement(resource,'execution:Context');
      if (!containerElement) {
        containerElement = elementHelper.createElement('execution:Context', {}, extensionElement, bpmnFactory);
        commands.push(cmdHelper.addAndRemoveElementsFromList(
          resource,
          extensionElement,
          'values',
          'extensionElements',
          [containerElement],
          []
        ));
      }
      var attribute = elementHelper.createElement('execution:Attribute', { key: value, type: 'xs:string' }, containerElement, bpmnFactory);
      commands.push(cmdHelper.addElementsTolist(resource, containerElement, 'attribute', [ attribute ]));

      return commands;
    },
    removeExtensionElement: function(element, extensionElement, value, idx, node) {
      var commands = [];
      var resource = getSelectedResource(element, node) || {};
      var extensionElement = resource.extensionElements;
      if ( !extensionElement ) return;
      var containerElement = getContainerElement(resource,'execution:Context') || {};
      var item = containerElement.attribute[idx];
//console.warn(containerElement);
      if (containerElement.attribute.length < 2) {
        commands.push(removeEntry(resource, extensionElement, containerElement));
      } else {
        commands.push(cmdHelper.removeElementsFromList(resource, containerElement, 'attribute', null, [item]));
      }

      return commands;
    },
    getExtensionElements: function(element, node) {
      var resource = getSelectedResource(element, node) || {};
      var extensionElement = resource.extensionElements;
      if ( !extensionElement ) return;
      var containerElement = getContainerElement(resource,'execution:Context') || {};
      return containerElement.attribute;
    },
    hideExtensionElements: function(element, node) {
      return !getSelectedResource(element, node);
    }
  });
  group.entries.push(contextEntry);

  // Attribute key entry
  group.entries.push(entryFactory.validationAwareTextField({
    id: 'context-attribute-key',
    label: translate('Key'),
    modelProperty: 'key',

    getProperty: function(element, node) {
      var attribute = getSelectedAttribute(element, node, 'execution:Status') || {}; 
      return attribute.key;
    },

    setProperty: function(element, properties, node) {
      var attribute = getSelectedAttribute(element, node, 'execution:Context');
      return cmdHelper.updateBusinessObject(element, attribute, properties);
    },

    hidden: function(element, node) {
      return !getSelectedAttribute(element, node, 'execution:Context');
    },

    validate: function(element, values, node) {
      var attribute = getSelectedAttribute(element, node, 'execution:Context') || {};
      if (attribute) {
        var keyValue = values.key;
        if (!keyValue || keyValue.trim() === '') {
          return { key: 'Key must not be empty.' };
        }
        var resource = getSelectedResource(element, node) || {};
        var attributes = (getContainerElement(resource, 'execution:Context') || {}).attribute;
        var existingKey = find(attributes, function(f) {
          return f !== attribute && f.key === keyValue;
        });
        if (existingKey) {
          return { key: 'Key is already used.' };
        }
      }
    }
  }));
///

  // Select attribute type
  group.entries.push(entryFactory.selectBox({
    id: 'context-attribute-type',
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
      var object = getSelectedAttribute(element, node, 'execution:Context') || {};
      return {
        type: object.type || 'xs:string'
      };
    },
    set: function(element, properties, node) {
console.log(properties);
//      if ( properties.type == '' ) properties.type = 'xs:string';
      var attribute = getSelectedAttribute(element, node, 'execution:Context');
      return cmdHelper.updateBusinessObject(element, attribute, properties);
    },
    hidden: function(element, node) {
      return !getSelectedAttribute(element, node, 'execution:Context');
    },
  }));

  /// Attribute value input field
  group.entries.push(entryFactory.textField({
    id: 'context-attribute-value',
    label: translate('Value'),
    modelProperty: 'value',
    get: function(element, node) {
      var attribute = getSelectedAttribute(element, node, 'execution:Context') || {}; 
      return { value: attribute.value };
    },

    set: function(element, properties, node) {
      var attribute = getSelectedAttribute(element, node, 'execution:Context');
      return cmdHelper.updateBusinessObject(element, attribute, properties);
    },
    hidden: function(element, node) {
      return !getSelectedAttribute(element, node, 'execution:Context');
    }
  }));

  //////////////////////
  // Restrictions entry
  //////////////////////

  // Select box entry
  var restrictionsEntry = extensionElements(element, bpmnFactory, {
    id: 'restrictions',
    label: translate('Restrictions'),
    modelProperty: 'id',
    prefix: 'Restriction',
    createExtensionElement: function(element, extensionElement, value, node) {
      var commands = [];
      var resource = getSelectedResource(element, node);
//console.warn(extensionElement);
      extensionElement = resource.extensionElements;
      if ( !extensionElement ) {
        extensionElement = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, resource, bpmnFactory);
        commands.push(cmdHelper.updateBusinessObject( resource, resource, { extensionElements: extensionElement }));
      }
      var containerElement = getContainerElement(resource,'execution:Restrictions');
      if (!containerElement) {
        containerElement = elementHelper.createElement('execution:Restrictions', {}, extensionElement, bpmnFactory);
        commands.push(cmdHelper.addAndRemoveElementsFromList(
          resource,
          extensionElement,
          'values',
          'extensionElements',
          [containerElement],
          []
        ));
      }
      var restriction = elementHelper.createElement('execution:Restriction', { id: value }, containerElement, bpmnFactory);
      commands.push(cmdHelper.addElementsTolist(resource, containerElement, 'restriction', [ restriction ]));

      return commands;
    },
    removeExtensionElement: function(element, extensionElement, value, idx, node) {
      var commands = [];
      var resource = getSelectedResource(element, node) || {};
      var extensionElement = resource.extensionElements;
      if ( !extensionElement ) return;
      var containerElement = getContainerElement(resource,'execution:Restrictions') || {};
      var item = containerElement.restriction[idx];
//console.warn(containerElement);
      if (containerElement.restriction.length < 2) {
        commands.push(removeEntry(resource, extensionElement, containerElement));
      } else {
        commands.push(cmdHelper.removeElementsFromList(resource, containerElement, 'restriction', null, [item]));
      }

      return commands;
    },
    getExtensionElements: function(element, node) {
      var resource = getSelectedResource(element, node) || {};
      var extensionElement = resource.extensionElements;
      if ( !extensionElement ) return;
      var containerElement = getContainerElement(resource,'execution:Restrictions') || {};
      return containerElement.restriction;
    },
    hideExtensionElements: function(element, node) {
      return !getSelectedResource(element, node);
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
        minInclusive = elementHelper.createElement('execution:MinInclusive', { 'value': values['minInclusive'] }, object, bpmnFactory);
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
        maxInclusive = elementHelper.createElement('execution:MaxInclusive', { 'value': values['maxInclusive'] }, object, bpmnFactory);
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

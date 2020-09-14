'use strict';

var is = require('bpmn-js/lib/util/ModelUtil').is,
    getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;

var getExtensionElements = require('bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper').getExtensionElements,
    removeEntry = require('bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper').removeEntry,
    entryFactory = require('bpmn-js-properties-panel/lib/factory/EntryFactory'),
    elementHelper = require('bpmn-js-properties-panel/lib/helper/ElementHelper'),
    cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper'),
    is = require('bpmn-js/lib/util/ModelUtil').is,
    find = require('lodash/find');

var extensionElements = require('./ExtensionElements'), helper = require('./Helper');


module.exports = function(group, element, bpmnFactory, translate) {

  if ( !is(element, 'bpmn:Task') || getBusinessObject(element).type != "Request") {
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
  function getSelectedRequest(element, node) {
    var selected = requestEntry.getSelected(element, node.parentNode);
    if (selected.idx === -1) {
      return;
    }
    return helper.getObject(element, selected.idx, 'execution:Allocations', 'request');
  }

  function getSelectedContent(entry, element, node) {
    var request = getSelectedRequest(element,node) ;
    var selected = entry.getSelected(element, node.parentNode);
    if (!request ||!request[entry.id] || selected.idx === -1) {
      return;
    }
    return request[entry.id][0].content[selected.idx];
  }

  function getSelectedRestriction(element, node) {
    var request = getSelectedRequest(element,node);
    var selected = restrictionsEntry.getSelected(element, node.parentNode);
    if (!request || !request.restrictions || selected.idx === -1) {
      return;
    }
    return request.restrictions[0].restriction[selected.idx];
  }

  // Select box entry
  var requestEntry = extensionElements(element, bpmnFactory, {
    id: 'request',
    label: translate('Requests'),
    modelProperty: 'id',
    prefix: 'Request',
    createExtensionElement: function(element, extensionElement, value) {
      var bo = getBusinessObject(element), commands = [];

      if (!extensionElement) {
        extensionElement = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
        commands.push(cmdHelper.updateProperties(element, { extensionElements: extensionElement }));
      }
      var containerElement = helper.getContainerElement(element,'execution:Allocations');
      if (!containerElement) {
        containerElement = elementHelper.createElement('execution:Allocations', {}, extensionElement, bpmnFactory);
        commands.push(cmdHelper.addAndRemoveElementsFromList(
          element,
          extensionElement,
          'values',
          'extensionElements',
          [containerElement],
          []
        ));
      }

      var request = elementHelper.createElement('execution:Request', { id: value }, containerElement, bpmnFactory);
        commands.push(cmdHelper.addElementsTolist(element, containerElement, 'request', [ request ]));

      return commands;
    },
    removeExtensionElement: function(element, extensionElement, value, idx) {
      var containerElement = helper.getContainerElement(element,'execution:Allocations');
      var entry = containerElement.request[idx],
          commands = [];

      if (containerElement.request.length < 2) {
        commands.push(removeEntry(getBusinessObject(element), element, containerElement));
      } else {
        commands.push(cmdHelper.removeElementsFromList(element, containerElement, 'request', null, [entry]));
      }

      return commands;
    },
    getExtensionElements: function(element) {
      return helper.getObjectList(element,'execution:Allocations','request');
    },
    hideExtensionElements: function(element, node) {
      return false;
    }
  });
  group.entries.push(requestEntry);

  // ID entry
  group.entries.push(entryFactory.validationAwareTextField({
    id: 'request-id',
    label: translate('ID'),
    modelProperty: 'id',

    getProperty: function(element, node) {
      var object = getSelectedRequest(element, node) || {};
      return object.id;
    },

    setProperty: function(element, properties, node) {
      var object = getSelectedRequest(element, node);
      return cmdHelper.updateBusinessObject(element, object, properties);
    },

    hidden: function(element, node) {
      return !getSelectedRequest(element, node);
    },

    validate: function(element, values, node) {
      var object = getSelectedRequest(element, node);
      if (object) {
        var idValue = values.id;
        if (!idValue || idValue.trim() === '') {
          return { id: 'Id must not be empty.' };
        }
        var objects = helper.getObjectList(element,'execution:Allocations','request');
        var existingID = find(objects, function(f) {
          return f !== object && f.id === idValue;
        });
        if (existingID) {
          return { id: 'Id is already used.' };
        }
      }
    }
  }));

  //////////////////////
  // Requirements entry
  //////////////////////

  // Select box entry
  var restrictionsEntry = extensionElements(element, bpmnFactory, {
    id: 'request-restrictions',
    label: translate('Resource restrictions'),
    modelProperty: 'id',
    prefix: 'Restriction',
    createExtensionElement: function(element, extensionElement, value, node) {
      var commands = [];
      var request = getSelectedRequest(element, node);
      var containerElement = (request.restrictions || [])[0];
      if (!containerElement) {
        containerElement = elementHelper.createElement('execution:Restrictions', {}, request, bpmnFactory);
        commands.push(cmdHelper.addAndRemoveElementsFromList(
          element,
          request,
          'restrictions',
          'request',
          [containerElement],
          []
        ));
      }

      var restriction = elementHelper.createElement('execution:Restriction', { id: value }, containerElement, bpmnFactory);
        commands.push(cmdHelper.addElementsTolist(element, containerElement, 'restriction', [ restriction ]));

      return commands;
    },
    removeExtensionElement: function(element, extensionElement, value, idx, node) {
      var commands = [];
      var request = getSelectedRequest(element, node);
      var containerElement = (request.restrictions || [])[0];
      var item = containerElement.restriction[idx];
      if (containerElement.restriction.length < 2) {
        commands.push(cmdHelper.removeElementsFromList(element, request, 'restrictions', null, [containerElement]));
      } else {
        commands.push(cmdHelper.removeElementsFromList(element, containerElement, 'restriction', null, [item]));
      }

      return commands;
    },
    getExtensionElements: function(element, node) {
      var request = getSelectedRequest(element, node) || {};
      return ((request.restrictions || [])[0] || {}).restriction;
    },
    hideExtensionElements: function(element, node) {
      return !getSelectedRequest(element, node);
    }
  });
  group.entries.push(restrictionsEntry);

  // ID entry
  group.entries.push(entryFactory.validationAwareTextField({
    id: 'request-restriction-id',
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
    id: 'request-restriction-attribute',
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
    id: 'request-restriction-mininclusive',
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
    id: 'request-restriction-maxinclusive',
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
    id: 'request-enumeration-list',
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
    id: 'request-restriction-negate',
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

  //////////////////////
  // Send content entry
  //////////////////////
  var sendContentsEntry = extensionElements(element, bpmnFactory, {
    id: 'send',
    label: translate('Send'),
    modelProperty: 'id',
    prefix: 'Content',
    createExtensionElement: function(element, extensionElement, value, node) {
      var commands = [];
      var request = getSelectedRequest(element, node);
      var containerElement = (request.send || [])[0];
      if (!containerElement) {
        containerElement = elementHelper.createElement('execution:Send', {}, request, bpmnFactory);
        commands.push(cmdHelper.addAndRemoveElementsFromList(
          element,
          request,
          'send',
          'request',
          [containerElement],
          []
        ));
      }

      var content = elementHelper.createElement('execution:Content', { id: value }, containerElement, bpmnFactory);
        commands.push(cmdHelper.addElementsTolist(element, containerElement, 'content', [ content ]));

      return commands;
    },
    removeExtensionElement: function(element, extensionElement, value, idx, node) {
      var commands = [];
      var request = getSelectedRequest(element, node);
      var containerElement = (request.send || [])[0];
      var item = containerElement.content[idx];
      if (containerElement.content.length < 2) {
        commands.push(cmdHelper.removeElementsFromList(element, request, 'send', null, [containerElement]));
      } else {
        commands.push(cmdHelper.removeElementsFromList(element, containerElement, 'content', null, [item]));
      }

      return commands;
    },
    getExtensionElements: function(element, node) {
      var request = getSelectedRequest(element, node) || {};
      return ((request.send || [])[0] || {}).content;
    },
    hideExtensionElements: function(element, node) {
      return !getSelectedRequest(element, node);
    }
  });
  group.entries.push(sendContentsEntry);

  // Content ID entry
  group.entries.push(entryFactory.validationAwareTextField({
    id: 'send-content-id',
    label: translate('Content Id'),
    modelProperty: 'id',

    getProperty: function(element, node) {
      var content = getSelectedContent(sendContentsEntry, element, node) || {}; 
      return content.id;
    },

    setProperty: function(element, properties, node) {
      var content = getSelectedContent(sendContentsEntry, element, node);
      return cmdHelper.updateBusinessObject(element, content, properties);
    },

    hidden: function(element, node) {
      return !getSelectedContent(sendContentsEntry, element, node);
    },

    validate: function(element, values, node) {
      var content = getSelectedContent(sendContentsEntry, element, node) || {};
      if (content) {
        var IdValue = values.id;
        if (!IdValue || IdValue.trim() === '') {
          return { id: 'Id must not be empty.' };
        }
        var message = helper.getObjectList(element,'execution:Send')
        var existingId = find(message, function(f) {
          return f !== content && f.id === IdValue;
        });
        if (existingId) {
          return { id: 'Id is already used.' };
        }
      }
    }
  }));

  // Content key entry
  group.entries.push(entryFactory.validationAwareTextField({
    id: 'send-content-key',
    label: translate('Key'),
    modelProperty: 'key',

    getProperty: function(element, node) {
      var content = getSelectedContent(sendContentsEntry, element, node) || {}; 
      return content.key;
    },

    setProperty: function(element, properties, node) {
      var content = getSelectedContent(sendContentsEntry, element, node);
      return cmdHelper.updateBusinessObject(element, content, properties);
    },

    hidden: function(element, node) {
      return !getSelectedContent(sendContentsEntry, element, node);
    },

    validate: function(element, values, node) {
      var content = getSelectedContent(sendContentsEntry, element, node) || {};
      if (content) {
        var keyValue = values.key;
        if (!keyValue || keyValue.trim() === '') {
          return { key: 'Key must not be empty.' };
        }
      }
    }
  }));

  /// attribute key entry
  group.entries.push(entryFactory.textField({
    id: 'send-content-attribute',
    label: translate('Attribute key of status'),
    modelProperty: 'attribute',
    get: function(element, node) {
      var content = getSelectedContent(sendContentsEntry, element, node) || {}; 
      return { attribute: content.attribute };
    },

    set: function(element, properties, node) {
      var content = getSelectedContent(sendContentsEntry, element, node);
      return cmdHelper.updateBusinessObject(element, content, properties);
    },
    hidden: function(element, node) {
      return !getSelectedContent(sendContentsEntry, element, node);
    }
  }));

  /// Content value input field
  group.entries.push(entryFactory.textField({
    id: 'send-content-value',
    label: translate('Value'),
    modelProperty: 'value',
    get: function(element, node) {
      var content = getSelectedContent(sendContentsEntry, element, node) || {}; 
      return { value: content.value };
    },

    set: function(element, properties, node) {
      var content = getSelectedContent(sendContentsEntry, element, node);
      return cmdHelper.updateBusinessObject(element, content, properties);
    },
    hidden: function(element, node) {
      return !getSelectedContent(sendContentsEntry, element, node);
    }
  }));

  //////////////////////
  // Receive content entry
  //////////////////////
  var receiveContentsEntry = extensionElements(element, bpmnFactory, {
    id: 'receive',
    label: translate('Receive'),
    modelProperty: 'id',
    prefix: 'Content',
    createExtensionElement: function(element, extensionElement, value, node) {
      var commands = [];
      var request = getSelectedRequest(element, node);
      var containerElement = (request.receive || [])[0];
      if (!containerElement) {
        containerElement = elementHelper.createElement('execution:Receive', {}, request, bpmnFactory);
        commands.push(cmdHelper.addAndRemoveElementsFromList(
          element,
          request,
          'receive',
          'request',
          [containerElement],
          []
        ));
      }

      var content = elementHelper.createElement('execution:Content', { id: value }, containerElement, bpmnFactory);
        commands.push(cmdHelper.addElementsTolist(element, containerElement, 'content', [ content ]));

      return commands;
    },
    removeExtensionElement: function(element, extensionElement, value, idx, node) {
      var commands = [];
      var request = getSelectedRequest(element, node);
      var containerElement = (request.receive || [])[0];
      var item = containerElement.content[idx];
      if (containerElement.content.length < 2) {
        commands.push(cmdHelper.removeElementsFromList(element, request, 'receive', null, [containerElement]));
      } else {
        commands.push(cmdHelper.removeElementsFromList(element, containerElement, 'content', null, [item]));
      }

      return commands;
    },
    getExtensionElements: function(element, node) {
	var request = getSelectedRequest(element, node) || {};
      return ((request.receive || [])[0] || {}).content;
    },
    hideExtensionElements: function(element, node) {
      return !getSelectedRequest(element, node);
    }
  });
  group.entries.push(receiveContentsEntry);

  // Content ID entry
  group.entries.push(entryFactory.validationAwareTextField({
    id: 'receive-content-id',
    label: translate('Content Id'),
    modelProperty: 'id',

    getProperty: function(element, node) {
      var content = getSelectedContent(receiveContentsEntry, element, node) || {}; 
      return content.id;
    },

    setProperty: function(element, properties, node) {
      var content = getSelectedContent(receiveContentsEntry, element, node);
      return cmdHelper.updateBusinessObject(element, content, properties);
    },

    hidden: function(element, node) {
      return !getSelectedContent(receiveContentsEntry, element, node);
    },

    validate: function(element, values, node) {
      var content = getSelectedContent(receiveContentsEntry, element, node) || {};
      if (content) {
        var IdValue = values.id;
        if (!IdValue || IdValue.trim() === '') {
          return { id: 'Id must not be empty.' };
        }
        var message = helper.getObjectList(element,'execution:Receive')
        var existingId = find(message, function(f) {
          return f !== content && f.id === IdValue;
        });
        if (existingId) {
          return { id: 'Id is already used.' };
        }
      }
    }
  }));

  // Content key entry
  group.entries.push(entryFactory.validationAwareTextField({
    id: 'receive-content-key',
    label: translate('Key'),
    modelProperty: 'key',

    getProperty: function(element, node) {
      var content = getSelectedContent(receiveContentsEntry, element, node) || {}; 
      return content.key;
    },

    setProperty: function(element, properties, node) {
      var content = getSelectedContent(receiveContentsEntry, element, node);
      return cmdHelper.updateBusinessObject(element, content, properties);
    },

    hidden: function(element, node) {
      return !getSelectedContent(receiveContentsEntry, element, node);
    },

    validate: function(element, values, node) {
      var content = getSelectedContent(receiveContentsEntry, element, node) || {};
      if (content) {
        var keyValue = values.key;
        if (!keyValue || keyValue.trim() === '') {
          return { key: 'Key must not be empty.' };
        }
      }
    }
  }));

  /// attribute key entry
  group.entries.push(entryFactory.textField({
    id: 'receive-content-attribute',
    label: translate('Attribute key of status'),
    modelProperty: 'attribute',
    get: function(element, node) {
      var content = getSelectedContent(receiveContentsEntry, element, node) || {}; 
      return { attribute: content.attribute };
    },

    set: function(element, properties, node) {
      var content = getSelectedContent(receiveContentsEntry, element, node);
      return cmdHelper.updateBusinessObject(element, content, properties);
    },
    hidden: function(element, node) {
      return !getSelectedContent(receiveContentsEntry, element, node);
    }
  }));


  /// Content value input field
  group.entries.push(entryFactory.textField({
    id: 'receive-content-value',
    label: translate('Value'),
    modelProperty: 'value',
    get: function(element, node) {
      var content = getSelectedContent(receiveContentsEntry, element, node) || {}; 
      return { value: content.value };
    },

    set: function(element, properties, node) {
      var content = getSelectedContent(receiveContentsEntry, element, node);
      return cmdHelper.updateBusinessObject(element, content, properties);
    },
    hidden: function(element, node) {
      return !getSelectedContent(receiveContentsEntry, element, node);
    }
  }));

};

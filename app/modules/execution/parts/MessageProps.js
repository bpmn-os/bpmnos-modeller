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


module.exports = function(group, element, bpmnFactory, translate) {
  var bo = getBusinessObject(element);
  var isCatching = ( is(element, 'bpmn:CatchEvent') && bo.eventDefinitions && bo.eventDefinitions[0].$type == "bpmn:MessageEventDefinition" )  || is(element, 'bpmn:ReceiveTask');
  var isThrowing = ( is(element, 'bpmn:ThrowEvent') && bo.eventDefinitions && bo.eventDefinitions[0].$type == "bpmn:MessageEventDefinition" )  || is(element, 'bpmn:SendTask');

  if ( !isCatching && !isThrowing ) {
    return;
  }

  function getSelectedContent(entry, element, node, type) {
    var selected = entry.getSelected(element, node.parentNode);
    if (selected.idx === -1) {
      return;
    }
    return helper.getObject(element, selected.idx, type);
  }

  // Participant name entry
  group.entries.push(entryFactory.textField(translate, {
    id: 'participant',
    label: translate('Participant name'),
    modelProperty: 'participant',
    get: function(element, node) {
      var messageElement = helper.getContainerElement(element,'execution:Message') || {};
      return { participant: (messageElement.$attrs || {}).participant };
    },
    set: function(element, properties, node) {
      var commands = [];
      var bo = getBusinessObject(element);
      var extensionElements = bo.get('extensionElements');
      if (!extensionElements) {
        extensionElements = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
        commands.push(cmdHelper.updateBusinessObject(element, bo, { extensionElements: extensionElements }));
      }
      var messageElement = helper.getContainerElement(element,'execution:Message');
      if (!messageElement) {
        messageElement = elementHelper.createElement('execution:Message', { participant: properties.participant }, extensionElements, bpmnFactory);
        commands.push(cmdHelper.addAndRemoveElementsFromList(
          element,
          extensionElements,
          'values',
          'extensionElements',
          [messageElement],
          []
        ));
      }
      else {
        commands.push(cmdHelper.updateBusinessObject(element, messageElement, properties));
      }
      return commands;
    }
  }));

  /// Process entry
  group.entries.push(entryFactory.textField(translate, {
    id: 'process',
    label: translate('Process Id'),
    modelProperty: 'process',
    get: function(element, node) {
      var messageElement = helper.getContainerElement(element,'execution:Message') || {};
      return { process: (messageElement.$attrs || {}).process };
    },

    set: function(element, properties, node) {
      var commands = [];
      var bo = getBusinessObject(element);
      var extensionElements = bo.get('extensionElements');
      if (!extensionElements) {
        extensionElements = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
        commands.push(cmdHelper.updateBusinessObject(element, bo, { extensionElements: extensionElements }));
      }
      var messageElement = helper.getContainerElement(element,'execution:Message');
      if (!messageElement) {
        messageElement = elementHelper.createElement('execution:Message', { process: properties.process }, extensionElements, bpmnFactory);
        commands.push(cmdHelper.addAndRemoveElementsFromList(
          element,
          extensionElements,
          'values',
          'extensionElements',
          [messageElement],
          []
        ));
      }
      else {
        commands.push(cmdHelper.updateBusinessObject(element, messageElement, properties));
      }
      return commands;
    }
  }));

  /// Instance entry
  group.entries.push(entryFactory.textField(translate, {
    id: 'instance',
    label: translate('Attribute name containing instance Id'),
    modelProperty: 'instance',
    get: function(element, node) {
      var messageElement = helper.getContainerElement(element,'execution:Message') || {};
      return { instance: (messageElement.$attrs || {}).instance };
    },
    set: function(element, properties, node) {
      var commands = [];
      var bo = getBusinessObject(element);
      var extensionElements = bo.get('extensionElements');
      if (!extensionElements) {
        extensionElements = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
        commands.push(cmdHelper.updateBusinessObject(element, bo, { extensionElements: extensionElements }));
      }
      var messageElement = helper.getContainerElement(element,'execution:Message');
      if (!messageElement) {
        messageElement = elementHelper.createElement('execution:Message', { instance: properties.instance }, extensionElements, bpmnFactory);
        commands.push(cmdHelper.addAndRemoveElementsFromList(
          element,
          extensionElements,
          'values',
          'extensionElements',
          [messageElement],
          []
        ));
      }
      else {
        commands.push(cmdHelper.updateBusinessObject(element, messageElement, properties));
      }
      return commands;
    }
  }));


  /// Request entry
  group.entries.push(entryFactory.textField(translate, {
    id: 'request',
    label: translate('Request Id'),
    modelProperty: 'request',
    get: function(element, node) {
      var containerElement = helper.getContainerElement( element, 'execution:Message') || {};
      return { request: (containerElement.$attrs || {}).request };
    },
    set: function(element, properties, node) {
      var commands = [];
      var bo = getBusinessObject(element);
      var extensionElements = bo.get('extensionElements');
      if (!extensionElements) {
        extensionElements = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
        commands.push(cmdHelper.updateBusinessObject(element, bo, { extensionElements: extensionElements }));
      }
      var containerElement = helper.getContainerElement(element, 'execution:Message');
      if (!containerElement) {
        containerElement = elementHelper.createElement('execution:Message', { request: properties.request }, extensionElements, bpmnFactory);
        commands.push(cmdHelper.addAndRemoveElementsFromList(
          element,
          extensionElements,
          'values',
          'extensionElements',
          [containerElement],
          []
        ));
      }
      else {
        commands.push(cmdHelper.updateBusinessObject(element, containerElement, properties));
      }
      return commands;
    }
  }));

  //////////////////////
  // Message content entry
  //////////////////////
  var messageContentsEntry = extensionElements(element, bpmnFactory, {
    id: 'message-content',
    label: translate('Content'),
    modelProperty: 'id',
    prefix: 'Content',
    createExtensionElement: function(element, extensionElement, value) {
      var bo = getBusinessObject(element), commands = [];

      if (!extensionElement) {
        extensionElement = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
        commands.push(cmdHelper.updateProperties(bo, { extensionElements: extensionElement }));
      }
      var containerElement = helper.getContainerElement(element,'execution:Message');
      if (!containerElement) {
        containerElement = elementHelper.createElement('execution:Message', {}, extensionElement, bpmnFactory);
        commands.push(cmdHelper.addAndRemoveElementsFromList(
          element,
          extensionElement,
          'values',
          'extensionElements',
          [containerElement],
          []
        ));
      }

      var content = elementHelper.createElement('execution:Content', { id: value }, containerElement, bpmnFactory);
        commands.push(cmdHelper.addElementsTolist(element, containerElement, 'content', [ content ]));

      return commands;
    },
    removeExtensionElement: function(element, extensionElement, value, idx) {
      var containerElement = helper.getContainerElement(element,'execution:Message');
      var entry = containerElement.content[idx],
          commands = [];

      commands.push(cmdHelper.removeElementsFromList(element, containerElement, 'content', null, [entry])); 

      return commands;
    },
    getExtensionElements: function(element) {
      return helper.getObjectList(element,'execution:Message');
    }
  });
  group.entries.push(messageContentsEntry);

  // Content ID entry
  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: 'message-content-id',
    label: translate('Content Id'),
    modelProperty: 'id',

    getProperty: function(element, node) {
      var content = getSelectedContent(messageContentsEntry, element, node, 'execution:Message') || {}; 
      return content.id;
    },

    setProperty: function(element, properties, node) {
      var content = getSelectedContent(messageContentsEntry, element, node, 'execution:Message');
      return cmdHelper.updateBusinessObject(element, content, properties);
    },

    hidden: function(element, node) {
      return !getSelectedContent(messageContentsEntry, element, node, 'execution:Message');
    },

    validate: function(element, values, node) {
      var content = getSelectedContent(messageContentsEntry, element, node, 'execution:Message') || {};
      if (content) {
        var IdValue = values.id;
        if (!IdValue || IdValue.trim() === '') {
          return { id: 'Id must not be empty.' };
        }
        var message = helper.getObjectList(element,'execution:Message')
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
  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: 'message-content-key',
    label: translate('Key'),
    modelProperty: 'key',

    getProperty: function(element, node) {
      var content = getSelectedContent(messageContentsEntry, element, node, 'execution:Message') || {}; 
      return content.key;
    },

    setProperty: function(element, properties, node) {
      var content = getSelectedContent(messageContentsEntry, element, node, 'execution:Message');
      return cmdHelper.updateBusinessObject(element, content, properties);
    },

    hidden: function(element, node) {
      return !getSelectedContent(messageContentsEntry, element, node, 'execution:Message');
    },

    validate: function(element, values, node) {
      var content = getSelectedContent(messageContentsEntry, element, node, 'execution:Message') || {};
      if (content) {
        var keyValue = values.key;
        if (!keyValue || keyValue.trim() === '') {
          return { key: 'Key must not be empty.' };
        }
      }
    }
  }));

  /// attribute key entry
  group.entries.push(entryFactory.textField(translate, {
    id: 'message-content-attribute',
    label: translate('Attribute name of status'),
    modelProperty: 'attribute',
    get: function(element, node) {
      var content = getSelectedContent(messageContentsEntry, element, node, 'execution:Message') || {}; 
      return { attribute: content.attribute };
    },

    set: function(element, properties, node) {
      var content = getSelectedContent(messageContentsEntry, element, node, 'execution:Message');
      return cmdHelper.updateBusinessObject(element, content, properties);
    },
    hidden: function(element, node) {
      return !getSelectedContent(messageContentsEntry, element, node, 'execution:Message');
    }
  }));


  /// Content value input field
  group.entries.push(entryFactory.textField(translate, {
    id: 'message-content-value',
    label: translate('Value'),
    modelProperty: 'value',
    get: function(element, node) {
      var content = getSelectedContent(messageContentsEntry, element, node, 'execution:Message') || {}; 
      return { value: content.value };
    },

    set: function(element, properties, node) {
      var content = getSelectedContent(messageContentsEntry, element, node, 'execution:Message');
      return cmdHelper.updateBusinessObject(element, content, properties);
    },
    hidden: function(element, node) {
      return !getSelectedContent(messageContentsEntry, element, node, 'execution:Message');
    }
  }));

};

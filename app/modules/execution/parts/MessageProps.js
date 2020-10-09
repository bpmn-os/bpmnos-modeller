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

  /// Sender entry
  group.entries.push(entryFactory.textField({
    id: 'sender',
    label: translate('Sender Id'),
    modelProperty: 'sender',
    get: function(element, node) {
      var receiveElement = helper.getContainerElement(element,'execution:Receive') || {};
      return { sender: (receiveElement.$attrs || {}).sender };
    },

    set: function(element, properties, node) {
      var commands = [];
      var bo = getBusinessObject(element);
      var extensionElements = bo.get('extensionElements');
      if (!extensionElements) {
        extensionElements = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
        commands.push(cmdHelper.updateBusinessObject(element, bo, { extensionElements: extensionElements }));
      }
      var receiveElement = helper.getContainerElement(element,'execution:Receive');
      if (!receiveElement) {
        receiveElement = elementHelper.createElement('execution:Receive', { sender: properties.sender }, extensionElements, bpmnFactory);
        commands.push(cmdHelper.addAndRemoveElementsFromList(
          element,
          extensionElements,
          'values',
          'extensionElements',
          [receiveElement],
          []
        ));
      }
      else {
        commands.push(cmdHelper.updateBusinessObject(element, receiveElement, properties));
      }
      return commands;
    },
    hidden: function(element, node) {
      return !isCatching;
    }
  }));

  /// Recipient entry
  group.entries.push(entryFactory.textField({
    id: 'recipient',
    label: translate('Recipient Id'),
    modelProperty: 'recipient',
    get: function(element, node) {
      var sendElement = helper.getContainerElement(element,'execution:Send') || {};
      return { recipient: (sendElement.$attrs || {}).recipient };
    },

    set: function(element, properties, node) {
      var commands = [];
      var bo = getBusinessObject(element);
      var extensionElements = bo.get('extensionElements');
      if (!extensionElements) {
        extensionElements = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
        commands.push(cmdHelper.updateBusinessObject(element, bo, { extensionElements: extensionElements }));
      }
      var sendElement = helper.getContainerElement(element,'execution:Send');
      if (!sendElement) {
        sendElement = elementHelper.createElement('execution:Send', { recipient: properties.recipient }, extensionElements, bpmnFactory);
        commands.push(cmdHelper.addAndRemoveElementsFromList(
          element,
          extensionElements,
          'values',
          'extensionElements',
          [sendElement],
          []
        ));
      }
      else {
        commands.push(cmdHelper.updateBusinessObject(element, sendElement, properties));
      }
      return commands;
    },
    hidden: function(element, node) {
      return !isThrowing;
    }
  }));

  /// Request entry
  group.entries.push(entryFactory.textField({
    id: 'request',
    label: translate('Request Id'),
    modelProperty: 'request',
    get: function(element, node) {
      var containerElement = helper.getContainerElement( element, isThrowing ? 'execution:Send' : 'execution:Receive') || {};
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
      var containerElement = helper.getContainerElement(element,isThrowing ? 'execution:Send' : 'execution:Receive');
      if (!containerElement) {
        containerElement = elementHelper.createElement(isThrowing ? 'execution:Send' : 'execution:Receive', { request: properties.request }, extensionElements, bpmnFactory);
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
    },
    hidden: function(element, node) {
      return false;
    }
  }));

  //////////////////////
  // Send content entry
  //////////////////////
  var sendContentsEntry = extensionElements(element, bpmnFactory, {
    id: 'send-content',
    label: translate('Send'),
    modelProperty: 'id',
    prefix: 'Content',
    createExtensionElement: function(element, extensionElement, value) {
      var bo = getBusinessObject(element), commands = [];

      if (!extensionElement) {
        extensionElement = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
        commands.push(cmdHelper.updateProperties(bo, { extensionElements: extensionElement }));
      }
      var containerElement = helper.getContainerElement(element,'execution:Send');
      if (!containerElement) {
        containerElement = elementHelper.createElement('execution:Send', {}, extensionElement, bpmnFactory);
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
      var containerElement = helper.getContainerElement(element,'execution:Send');
      var entry = containerElement.content[idx],
          commands = [];

/*
      if (containerElement.content.length < 2) {
        commands.push(removeEntry(getBusinessObject(element), element, containerElement));
      } else {
      }
*/
      commands.push(cmdHelper.removeElementsFromList(element, containerElement, 'content', null, [entry])); 
      return commands;
    },
    getExtensionElements: function(element) {
      return helper.getObjectList(element,'execution:Send');
    },
    hideExtensionElements: function(element, node) {
      return !isThrowing;
    }
  });
  group.entries.push(sendContentsEntry);

  // Content ID entry
  group.entries.push(entryFactory.validationAwareTextField({
    id: 'send-content-id',
    label: translate('Content Id'),
    modelProperty: 'id',

    getProperty: function(element, node) {
      var content = getSelectedContent(sendContentsEntry, element, node, 'execution:Send') || {}; 
      return content.id;
    },

    setProperty: function(element, properties, node) {
      var content = getSelectedContent(sendContentsEntry, element, node, 'execution:Send');
      return cmdHelper.updateBusinessObject(element, content, properties);
    },

    hidden: function(element, node) {
      return !getSelectedContent(sendContentsEntry, element, node, 'execution:Send');
    },

    validate: function(element, values, node) {
      var content = getSelectedContent(sendContentsEntry, element, node, 'execution:Send') || {};
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
      var content = getSelectedContent(sendContentsEntry, element, node, 'execution:Send') || {}; 
      return content.key;
    },

    setProperty: function(element, properties, node) {
      var content = getSelectedContent(sendContentsEntry, element, node, 'execution:Send');
      return cmdHelper.updateBusinessObject(element, content, properties);
    },

    hidden: function(element, node) {
      return !getSelectedContent(sendContentsEntry, element, node, 'execution:Send');
    },

    validate: function(element, values, node) {
      var content = getSelectedContent(sendContentsEntry, element, node, 'execution:Send') || {};
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
    label: translate('Attribute name of status'),
    modelProperty: 'attribute',
    get: function(element, node) {
      var content = getSelectedContent(sendContentsEntry, element, node, 'execution:Send') || {}; 
      return { attribute: content.attribute };
    },

    set: function(element, properties, node) {
      var content = getSelectedContent(sendContentsEntry, element, node, 'execution:Send');
      return cmdHelper.updateBusinessObject(element, content, properties);
    },
    hidden: function(element, node) {
      return !getSelectedContent(sendContentsEntry, element, node, 'execution:Send');
    }
  }));


  /// Content value input field
  group.entries.push(entryFactory.textField({
    id: 'send-content-value',
    label: translate('Value'),
    modelProperty: 'value',
    get: function(element, node) {
      var content = getSelectedContent(sendContentsEntry, element, node, 'execution:Send') || {}; 
      return { value: content.value };
    },

    set: function(element, properties, node) {
      var content = getSelectedContent(sendContentsEntry, element, node, 'execution:Send');
      return cmdHelper.updateBusinessObject(element, content, properties);
    },
    hidden: function(element, node) {
      return !getSelectedContent(sendContentsEntry, element, node, 'execution:Send');
    }
  }));

  //////////////////////
  // Receive content entry
  //////////////////////
  var receiveContentsEntry = extensionElements(element, bpmnFactory, {
    id: 'receive-content',
    label: translate('Receive'),
    modelProperty: 'id',
    prefix: 'Content',
    createExtensionElement: function(element, extensionElement, value) {
      var bo = getBusinessObject(element), commands = [];

      if (!extensionElement) {
        extensionElement = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
        commands.push(cmdHelper.updateProperties(bo, { extensionElements: extensionElement }));
      }
      var containerElement = helper.getContainerElement(element,'execution:Receive');
      if (!containerElement) {
        containerElement = elementHelper.createElement('execution:Receive', {}, extensionElement, bpmnFactory);
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
      var containerElement = helper.getContainerElement(element,'execution:Receive');
      var entry = containerElement.content[idx],
          commands = [];

/*
      if (containerElement.content.length < 2) {
        commands.push(removeEntry(getBusinessObject(element), element, containerElement));
      } else {
      }
*/
      commands.push(cmdHelper.removeElementsFromList(element, containerElement, 'content', null, [entry])); 

      return commands;
    },
    getExtensionElements: function(element) {
      return helper.getObjectList(element,'execution:Receive');
    },
    hideExtensionElements: function(element, node) {
      return !isCatching;
    }
  });
  group.entries.push(receiveContentsEntry);

  // Content ID entry
  group.entries.push(entryFactory.validationAwareTextField({
    id: 'receive-content-id',
    label: translate('Content Id'),
    modelProperty: 'id',

    getProperty: function(element, node) {
      var content = getSelectedContent(receiveContentsEntry, element, node, 'execution:Receive') || {}; 
      return content.id;
    },

    setProperty: function(element, properties, node) {
      var content = getSelectedContent(receiveContentsEntry, element, node, 'execution:Receive');
      return cmdHelper.updateBusinessObject(element, content, properties);
    },

    hidden: function(element, node) {
      return !getSelectedContent(receiveContentsEntry, element, node, 'execution:Receive');
    },

    validate: function(element, values, node) {
      var content = getSelectedContent(receiveContentsEntry, element, node, 'execution:Receive') || {};
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
      var content = getSelectedContent(receiveContentsEntry, element, node, 'execution:Receive') || {}; 
      return content.key;
    },

    setProperty: function(element, properties, node) {
      var content = getSelectedContent(receiveContentsEntry, element, node, 'execution:Receive');
      return cmdHelper.updateBusinessObject(element, content, properties);
    },

    hidden: function(element, node) {
      return !getSelectedContent(receiveContentsEntry, element, node, 'execution:Receive');
    },

    validate: function(element, values, node) {
      var content = getSelectedContent(receiveContentsEntry, element, node, 'execution:Receive') || {};
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
    label: translate('Attribute name of status'),
    modelProperty: 'attribute',
    get: function(element, node) {
      var content = getSelectedContent(receiveContentsEntry, element, node, 'execution:Receive') || {}; 
      return { attribute: content.attribute };
    },

    set: function(element, properties, node) {
      var content = getSelectedContent(receiveContentsEntry, element, node, 'execution:Receive');
      return cmdHelper.updateBusinessObject(element, content, properties);
    },
    hidden: function(element, node) {
      return !getSelectedContent(receiveContentsEntry, element, node, 'execution:Receive');
    }
  }));


  /// Content value input field
  group.entries.push(entryFactory.textField({
    id: 'receive-content-value',
    label: translate('Value'),
    modelProperty: 'value',
    get: function(element, node) {
      var content = getSelectedContent(receiveContentsEntry, element, node, 'execution:Receive') || {}; 
      return { value: content.value };
    },

    set: function(element, properties, node) {
      var content = getSelectedContent(receiveContentsEntry, element, node, 'execution:Receive');
      return cmdHelper.updateBusinessObject(element, content, properties);
    },
    hidden: function(element, node) {
      return !getSelectedContent(receiveContentsEntry, element, node, 'execution:Receive');
    }
  }));

};

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

  if ( !is(element, 'bpmn:Task') || getBusinessObject(element).type != "Release") {
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
  function getSelectedRelease(element, node) {
    var selected = releaseEntry.getSelected(element, node.parentNode);
    if (selected.idx === -1) {
      return;
    }
    return helper.getObject(element, selected.idx, 'execution:Allocations','release');
  }

  function getSelectedContent(entry, element, node) {
    var release = getSelectedRelease(element,node) ;
    var selected = entry.getSelected(element, node.parentNode);
    if (!release ||!release[entry.id] || selected.idx === -1) {
      return;
    }
    return release[entry.id][0].content[selected.idx];
  }

  // Select box entry
  var releaseEntry = extensionElements(element, bpmnFactory, {
    id: 'release',
    label: translate('Releases'),
    modelProperty: 'id',
    prefix: 'Release',
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

      var release = elementHelper.createElement('execution:Release', { id: value }, containerElement, bpmnFactory);
        commands.push(cmdHelper.addElementsTolist(element, containerElement, 'release', [ release ]));

      return commands;
    },
    removeExtensionElement: function(element, extensionElement, value, idx) {
      var containerElement = helper.getContainerElement(element,'execution:Allocations');
      var entry = containerElement.release[idx],
          commands = [];

      if (containerElement.release.length < 2) {
        commands.push(removeEntry(getBusinessObject(element), element, containerElement));
      } else {
        commands.push(cmdHelper.removeElementsFromList(element, containerElement, 'release', null, [entry]));
      }

      return commands;
    },
    getExtensionElements: function(element) {
      return helper.getObjectList(element,'execution:Allocations', 'release');
    },
    hideExtensionElements: function(element, node) {
      return false;
    }
  });
  group.entries.push(releaseEntry);

  // ID entry
  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: 'release-id',
    label: translate('Id'),
    modelProperty: 'id',

    getProperty: function(element, node) {
      var object = getSelectedRelease(element, node) || {};
      return object.id;
    },

    setProperty: function(element, properties, node) {
      var object = getSelectedRelease(element, node);
      return cmdHelper.updateBusinessObject(element, object, properties);
    },

    hidden: function(element, node) {
      return !getSelectedRelease(element, node);
    },

    validate: function(element, values, node) {
      var object = getSelectedRelease(element, node);
      if (object) {
        var idValue = values.id;
        if (!idValue || idValue.trim() === '') {
          return { id: 'Id must not be empty.' };
        }
        var objects = helper.getObjectList(element,'execution:Allocations','release');
        var existingID = find(objects, function(f) {
          return f !== object && f.id === idValue;
        });
        if (existingID) {
          return { id: 'Id is already used.' };
        }
      }
    }
  }));

  /// Request id input field
  group.entries.push(entryFactory.textField(translate, {
    id: 'request',
    label: translate('Id of request to be released'),
    modelProperty: 'request',
    get: function(element, node) {
      var content = getSelectedRelease(element, node) || {}; 
      return { request: content.request };
    },

    set: function(element, properties, node) {
      var content = getSelectedRelease(element, node);
      return cmdHelper.updateBusinessObject(element, content, properties);
    },
    hidden: function(element, node) {
      return !getSelectedRelease(element, node);
    }
  }));

  /// Update process entry
  group.entries.push(entryFactory.textField(translate, {
    id: 'update',
    label: translate('Id of update process'),
    modelProperty: 'update',
    get: function(element, node) {
      var content = getSelectedRelease(element, node) || {}; 
      return { update: content.update };
    },

    set: function(element, properties, node) {
      var content = getSelectedRelease(element, node);
      return cmdHelper.updateBusinessObject(element, content, properties);
    },
    hidden: function(element, node) {
      return !getSelectedRelease(element, node);
    }
  }));

/*

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
      var release = getSelectedRelease(element, node);
      var containerElement = (release.send || [])[0];
      if (!containerElement) {
        containerElement = elementHelper.createElement('execution:Send', {}, release, bpmnFactory);
        commands.push(cmdHelper.addAndRemoveElementsFromList(
          element,
          release,
          'send',
          'release',
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
      var release = getSelectedRelease(element, node);
      var containerElement = (release.send || [])[0];
      var item = containerElement.content[idx];
      if (containerElement.content.length < 2) {
        commands.push(cmdHelper.removeElementsFromList(element, release, 'send', null, [containerElement]));
      } else {
        commands.push(cmdHelper.removeElementsFromList(element, containerElement, 'content', null, [item]));
      }

      return commands;
    },
    getExtensionElements: function(element, node) {
	var release = getSelectedRelease(element, node) || {};
      return ((release.send || [])[0] || {}).content;
    },
    hideExtensionElements: function(element, node) {
      return !getSelectedRelease(element, node);
    }
  });
  group.entries.push(sendContentsEntry);

  // Content ID entry
  group.entries.push(entryFactory.validationAwareTextField(translate, {
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
  group.entries.push(entryFactory.validationAwareTextField(translate, {
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
  group.entries.push(entryFactory.textField(translate, {
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
  group.entries.push(entryFactory.textField(translate, {
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
      var release = getSelectedRelease(element, node);
      var containerElement = (release.receive || [])[0];
      if (!containerElement) {
        containerElement = elementHelper.createElement('execution:Receive', {}, release, bpmnFactory);
        commands.push(cmdHelper.addAndRemoveElementsFromList(
          element,
          release,
          'receive',
          'release',
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
      var release = getSelectedRelease(element, node);
      var containerElement = (release.receive || [])[0];
      var item = containerElement.content[idx];
      if (containerElement.content.length < 2) {
        commands.push(cmdHelper.removeElementsFromList(element, release, 'receive', null, [containerElement]));
      } else {
        commands.push(cmdHelper.removeElementsFromList(element, containerElement, 'content', null, [item]));
      }

      return commands;
    },
    getExtensionElements: function(element, node) {
	var release = getSelectedRelease(element, node) || {};
      return ((release.receive || [])[0] || {}).content;
    },
    hideExtensionElements: function(element, node) {
      return !getSelectedRelease(element, node);
    }
  });
  group.entries.push(receiveContentsEntry);

  // Content ID entry
  group.entries.push(entryFactory.validationAwareTextField(translate, {
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
  group.entries.push(entryFactory.validationAwareTextField(translate, {
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
  group.entries.push(entryFactory.textField(translate, {
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
  group.entries.push(entryFactory.textField(translate, {
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
*/
};

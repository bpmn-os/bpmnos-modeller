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
  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: 'request-id',
    label: translate('Id'),
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

  /// Update process entry
  group.entries.push(entryFactory.textField(translate, {
    id: 'update',
    label: translate('Id of update process'),
    modelProperty: 'update',
    get: function(element, node) {
      var content = getSelectedRequest(element, node) || {}; 
      return { update: content.update };
    },

    set: function(element, properties, node) {
      var content = getSelectedRequest(element, node);
      return cmdHelper.updateBusinessObject(element, content, properties);
    },
    hidden: function(element, node) {
      return !getSelectedRequest(element, node);
    }
  }));

/*
  //////////////////////
  // Requirements entry
  //////////////////////

  var requirementsContentsEntry = extensionElements(element, bpmnFactory, {
    id: 'requirements',
    label: translate('Requirements'),
    modelProperty: 'id',
    prefix: 'Content',
    createExtensionElement: function(element, extensionElement, value, node) {
      var commands = [];
      var request = getSelectedRequest(element, node);
      var containerElement = (request.requirements || [])[0];
      if (!containerElement) {
        containerElement = elementHelper.createElement('execution:Requirements', {}, request, bpmnFactory);
        commands.push(cmdHelper.addAndRemoveElementsFromList(
          element,
          request,
          'requirements',
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
      var containerElement = (request.requirements || [])[0];
      var item = containerElement.content[idx];
      if (containerElement.content.length < 2) {
        commands.push(cmdHelper.removeElementsFromList(element, request, 'requirements', null, [containerElement]));
      } else {
        commands.push(cmdHelper.removeElementsFromList(element, containerElement, 'content', null, [item]));
      }

      return commands;
    },
    getExtensionElements: function(element, node) {
      var request = getSelectedRequest(element, node) || {};
      return ((request.requirements || [])[0] || {}).content;
    },
    hideExtensionElements: function(element, node) {
      return !getSelectedRequest(element, node);
    }
  });
  group.entries.push(requirementsContentsEntry);

  // Content ID entry
  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: 'requirements-content-id',
    label: translate('Content Id'),
    modelProperty: 'id',

    getProperty: function(element, node) {
      var content = getSelectedContent(requirementsContentsEntry, element, node) || {}; 
      return content.id;
    },

    setProperty: function(element, properties, node) {
      var content = getSelectedContent(requirementsContentsEntry, element, node);
      return cmdHelper.updateBusinessObject(element, content, properties);
    },

    hidden: function(element, node) {
      return !getSelectedContent(requirementsContentsEntry, element, node);
    },

    validate: function(element, values, node) {
      var content = getSelectedContent(requirementsContentsEntry, element, node) || {};
      if (content) {
        var IdValue = values.id;
        if (!IdValue || IdValue.trim() === '') {
          return { id: 'Id must not be empty.' };
        }
        var message = helper.getObjectList(element,'execution:Requirements')
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
    id: 'requirements-content-key',
    label: translate('Key'),
    modelProperty: 'key',

    getProperty: function(element, node) {
      var content = getSelectedContent(requirementsContentsEntry, element, node) || {}; 
      return content.key;
    },

    setProperty: function(element, properties, node) {
      var content = getSelectedContent(requirementsContentsEntry, element, node);
      return cmdHelper.updateBusinessObject(element, content, properties);
    },

    hidden: function(element, node) {
      return !getSelectedContent(requirementsContentsEntry, element, node);
    },

    validate: function(element, values, node) {
      var content = getSelectedContent(requirementsContentsEntry, element, node) || {};
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
    id: 'requirements-content-attribute',
    label: translate('Attribute name of status'),
    modelProperty: 'attribute',
    get: function(element, node) {
      var content = getSelectedContent(requirementsContentsEntry, element, node) || {}; 
      return { attribute: content.attribute };
    },

    set: function(element, properties, node) {
      var content = getSelectedContent(requirementsContentsEntry, element, node);
      return cmdHelper.updateBusinessObject(element, content, properties);
    },
    hidden: function(element, node) {
      return !getSelectedContent(requirementsContentsEntry, element, node);
    }
  }));

  /// Content value input field
  group.entries.push(entryFactory.textField(translate, {
    id: 'requirements-content-value',
    label: translate('Value'),
    modelProperty: 'value',
    get: function(element, node) {
      var content = getSelectedContent(requirementsContentsEntry, element, node) || {}; 
      return { value: content.value };
    },

    set: function(element, properties, node) {
      var content = getSelectedContent(requirementsContentsEntry, element, node);
      return cmdHelper.updateBusinessObject(element, content, properties);
    },
    hidden: function(element, node) {
      return !getSelectedContent(requirementsContentsEntry, element, node);
    }
  }));
*/

  //////////////////////
  // Job content entry
  //////////////////////
  var jobContentsEntry = extensionElements(element, bpmnFactory, {
    id: 'job',
    label: translate('Job content'),
    modelProperty: 'id',
    prefix: 'Content',
    createExtensionElement: function(element, extensionElement, value, node) {
      var commands = [];
      var request = getSelectedRequest(element, node);
      var containerElement = (request.job || [])[0];
      if (!containerElement) {
        containerElement = elementHelper.createElement('execution:Job', {}, request, bpmnFactory);
        commands.push(cmdHelper.addAndRemoveElementsFromList(
          element,
          request,
          'job',
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
      var containerElement = (request.job || [])[0];
      var item = containerElement.content[idx];
      if (containerElement.content.length < 2) {
        commands.push(cmdHelper.removeElementsFromList(element, request, 'job', null, [containerElement]));
      } else {
        commands.push(cmdHelper.removeElementsFromList(element, containerElement, 'content', null, [item]));
      }

      return commands;
    },
    getExtensionElements: function(element, node) {
      var request = getSelectedRequest(element, node) || {};
      return ((request.job || [])[0] || {}).content;
    },
    hideExtensionElements: function(element, node) {
      return !getSelectedRequest(element, node);
    }
  });
  group.entries.push(jobContentsEntry);

  // Job content ID entry
  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: 'job-content-id',
    label: translate('Content Id'),
    modelProperty: 'id',

    getProperty: function(element, node) {
      var content = getSelectedContent(jobContentsEntry, element, node) || {}; 
      return content.id;
    },

    setProperty: function(element, properties, node) {
      var content = getSelectedContent(jobContentsEntry, element, node);
      return cmdHelper.updateBusinessObject(element, content, properties);
    },

    hidden: function(element, node) {
      return !getSelectedContent(jobContentsEntry, element, node);
    },

    validate: function(element, values, node) {
      var content = getSelectedContent(jobContentsEntry, element, node) || {};
      if (content) {
        var IdValue = values.id;
        if (!IdValue || IdValue.trim() === '') {
          return { id: 'Id must not be empty.' };
        }
        var message = helper.getObjectList(element,'execution:Job')
        var existingId = find(message, function(f) {
          return f !== content && f.id === IdValue;
        });
        if (existingId) {
          return { id: 'Id is already used.' };
        }
      }
    }
  }));

  // Job content key entry
  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: 'job-content-key',
    label: translate('Key'),
    modelProperty: 'key',

    getProperty: function(element, node) {
      var content = getSelectedContent(jobContentsEntry, element, node) || {}; 
      return content.key;
    },

    setProperty: function(element, properties, node) {
      var content = getSelectedContent(jobContentsEntry, element, node);
      return cmdHelper.updateBusinessObject(element, content, properties);
    },

    hidden: function(element, node) {
      return !getSelectedContent(jobContentsEntry, element, node);
    },

    validate: function(element, values, node) {
      var content = getSelectedContent(jobContentsEntry, element, node) || {};
      if (content) {
        var keyValue = values.key;
        if (!keyValue || keyValue.trim() === '') {
          return { key: 'Key must not be empty.' };
        }
      }
    }
  }));

  /// Job content attribute entry
  group.entries.push(entryFactory.textField(translate, {
    id: 'job-content-attribute',
    label: translate('Attribute name'),
    modelProperty: 'attribute',
    get: function(element, node) {
      var content = getSelectedContent(jobContentsEntry, element, node) || {}; 
      return { attribute: content.attribute };
    },

    set: function(element, properties, node) {
      var content = getSelectedContent(jobContentsEntry, element, node);
      return cmdHelper.updateBusinessObject(element, content, properties);
    },
    hidden: function(element, node) {
      return !getSelectedContent(jobContentsEntry, element, node);
    }
  }));

  /// Job content value input field
  group.entries.push(entryFactory.textField(translate, {
    id: 'job-content-value',
    label: translate('Value'),
    modelProperty: 'value',
    get: function(element, node) {
      var content = getSelectedContent(jobContentsEntry, element, node) || {}; 
      return { value: content.value };
    },

    set: function(element, properties, node) {
      var content = getSelectedContent(jobContentsEntry, element, node);
      return cmdHelper.updateBusinessObject(element, content, properties);
    },
    hidden: function(element, node) {
      return !getSelectedContent(jobContentsEntry, element, node);
    }
  }));

  //////////////////////
  // Response content entry
  //////////////////////
  var responseContentsEntry = extensionElements(element, bpmnFactory, {
    id: 'response',
    label: translate('Expected response content'),
    modelProperty: 'id',
    prefix: 'Content',
    createExtensionElement: function(element, extensionElement, value, node) {
      var commands = [];
      var request = getSelectedRequest(element, node);
      var containerElement = (request.response || [])[0];
      if (!containerElement) {
        containerElement = elementHelper.createElement('execution:Response', {}, request, bpmnFactory);
        commands.push(cmdHelper.addAndRemoveElementsFromList(
          element,
          request,
          'response',
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
      var containerElement = (request.response || [])[0];
      var item = containerElement.content[idx];
      if (containerElement.content.length < 2) {
        commands.push(cmdHelper.removeElementsFromList(element, request, 'response', null, [containerElement]));
      } else {
        commands.push(cmdHelper.removeElementsFromList(element, containerElement, 'content', null, [item]));
      }

      return commands;
    },
    getExtensionElements: function(element, node) {
      var request = getSelectedRequest(element, node) || {};
      return ((request.response || [])[0] || {}).content;
    },
    hideExtensionElements: function(element, node) {
      return !getSelectedRequest(element, node);
    }
  });
  group.entries.push(responseContentsEntry);

  // Response content ID entry
  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: 'response-content-id',
    label: translate('Content Id'),
    modelProperty: 'id',

    getProperty: function(element, node) {
      var content = getSelectedContent(responseContentsEntry, element, node) || {}; 
      return content.id;
    },

    setProperty: function(element, properties, node) {
      var content = getSelectedContent(responseContentsEntry, element, node);
      return cmdHelper.updateBusinessObject(element, content, properties);
    },

    hidden: function(element, node) {
      return !getSelectedContent(responseContentsEntry, element, node);
    },

    validate: function(element, values, node) {
      var content = getSelectedContent(responseContentsEntry, element, node) || {};
      if (content) {
        var IdValue = values.id;
        if (!IdValue || IdValue.trim() === '') {
          return { id: 'Id must not be empty.' };
        }
        var message = helper.getObjectList(element,'execution:Response')
        var existingId = find(message, function(f) {
          return f !== content && f.id === IdValue;
        });
        if (existingId) {
          return { id: 'Id is already used.' };
        }
      }
    }
  }));

  // Response content key entry
  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: 'response-content-key',
    label: translate('Key'),
    modelProperty: 'key',

    getProperty: function(element, node) {
      var content = getSelectedContent(responseContentsEntry, element, node) || {}; 
      return content.key;
    },

    setProperty: function(element, properties, node) {
      var content = getSelectedContent(responseContentsEntry, element, node);
      return cmdHelper.updateBusinessObject(element, content, properties);
    },

    hidden: function(element, node) {
      return !getSelectedContent(responseContentsEntry, element, node);
    },

    validate: function(element, values, node) {
      var content = getSelectedContent(responseContentsEntry, element, node) || {};
      if (content) {
        var keyValue = values.key;
        if (!keyValue || keyValue.trim() === '') {
          return { key: 'Key must not be empty.' };
        }
      }
    }
  }));

  // Response content attribute entry
  group.entries.push(entryFactory.validationAwareTextField(translate, {
    id: 'response-content-attribute',
    label: translate('Attribute name'),
    modelProperty: 'attribute',

    getProperty: function(element, node) {
      var content = getSelectedContent(responseContentsEntry, element, node) || {}; 
      return content.attribute;
    },

    setProperty: function(element, properties, node) {
      var content = getSelectedContent(responseContentsEntry, element, node);
      return cmdHelper.updateBusinessObject(element, content, properties);
    },

    hidden: function(element, node) {
      return !getSelectedContent(responseContentsEntry, element, node);
    },

    validate: function(element, values, node) {
      var content = getSelectedContent(responseContentsEntry, element, node) || {};
      if (content) {
        var attributeValue = values.attribute;
        if (!attributeValue || attributeValue.trim() === '') {
          return { attribute: 'Attribute must not be empty.' };
        }
      }
    }
  }));

};

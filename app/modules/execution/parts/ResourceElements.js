'use strict';

var is = require('bpmn-js/lib/util/ModelUtil').is;

var domQuery = require('min-dom').query,
    domClosest = require('min-dom').closest,
    domify = require('min-dom').domify,
    forEach = require('lodash/forEach');

var elementHelper = require('bpmn-js-properties-panel/lib/helper/ElementHelper'),
    cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper'),
    resourceHelper = require('./ResourceHelper'),
    utils = require('bpmn-js-properties-panel/lib/Utils'),
    escapeHTML = utils.escapeHTML;

function getSelectBox(node, id) {
  var currentTab = domClosest(node, 'div.bpp-properties-tab');
  var query = 'select[name=selectedResourceElement]' + (id ? '[id=cam-resourceElements-' + id + ']' : '');
  return domQuery(query, currentTab);
}

function getSelected(node, id) {
  var selectBox = getSelectBox(node, id);
  return {
    value: (selectBox || {}).value,
    idx: (selectBox || {}).selectedIndex
  };
}

function generateElementId(prefix) {
  prefix = prefix + '_';
  return utils.nextId(prefix);
}

var CREATE_RESOURCE_ELEMENT_ACTION = 'create-resource-element',
    REMOVE_RESOURCE_ELEMENT_ACTION = 'remove-resource-element';

module.exports = function(element, bpmnFactory, options, translate) {

  var id = options.id,
      prefix = options.prefix || 'Resource',
      label = options.label || id;

  var createElement = options.createExtensionElements,
      canCreate = typeof createElement === 'function';

  var removeElement = options.removeExtensionElements,
      canRemove = typeof removeElement === 'function';

  var onSelectionChange = options.onSelectionChange;

  var hideElements = options.hideExtensionElements,
      canBeHidden = typeof hideElements === 'function';

  var setOptionLabelValue = options.setOptionLabelValue;

  var defaultSize = options.size || 5,
      resizable = options.resizable;

  var reference = options.reference || undefined;

  var selectionChanged = function(element, node, event, scope) {
    if (typeof onSelectionChange === 'function') {
      return onSelectionChange(element, node, event, scope);
    }
  };

  var createOption = function(value) {
    return '<option value="' + escapeHTML(value) + '" data-value data-name="resourceElementValue">' + escapeHTML(value) + '</option>';
  };

  var initSelectionSize = function(selectBox, optionsLength) {
    if (resizable) {
      selectBox.size = optionsLength > defaultSize ? optionsLength : defaultSize;
    }
  };

  return {
    id: id,
    html: '<div class="bpp-row bpp-element-list" ' +
            (canBeHidden ? 'data-show="hideElements"' : '') + '>' +
            '<label for="cam-resourceElements-' + escapeHTML(id) + '">' + escapeHTML(label) + '</label>' +
            '<div class="bpp-field-wrapper">' +
              '<select id="cam-resourceElements-' + escapeHTML(id) + '"' +
                      'name="selectedResourceElement" ' +
                      'size="' + escapeHTML(defaultSize) + '" ' +
                      'data-list-entry-container ' +
                      'data-on-change="selectElement">' +
              '</select>' +
              (canCreate ? '<button class="add" ' +
                                   'id="cam-resourceElements-create-' + escapeHTML(id) + '" ' +
                                   'data-action="createElement">' +
                             '<span>+</span>' +
                           '</button>' : '') +
              (canRemove ? '<button class="clear" ' +
                                   'id="cam-resourceElements-remove-' + escapeHTML(id) + '" ' +
                                   'data-action="removeElement" ' +
                                   'data-disable="disableRemove">' +
                             '<span>-</span>' +
                           '</button>' : '') +
            '</div>' +
          '</div>',

    get: function(element, node) {
      var definitions = modeler.getDefinitions();
      var resources = resourceHelper.getResources();
      var result = [];
      forEach(resources, function(elem) {
        result.push({
          resourceElementValue: elem.get('id')
        });
      });

      var selectBox = getSelectBox(node.parentNode, id);
      initSelectionSize(selectBox, result.length);

//console.warn("ResourceElement:GET",result);
      return result;
    },

    set: function(element, values, node) {
      var action = this.__action;
      delete this.__action;
//console.warn("ResourceElement:SET",values,action);

      var commands = [];
      var definitions = modeler.getDefinitions();
        element = definitions;

//      var resources = resourceHelper.getResources();

      if (action.id === CREATE_RESOURCE_ELEMENT_ACTION) {
        /// Create bpmn:resource element and include an extension element
        var resourceElement = elementHelper.createElement('bpmn:Resource', { id: action.value}, definitions, bpmnFactory);
        commands.push(cmdHelper.addElementsTolist(definitions, definitions, 'rootElements', [ resourceElement ]));
      }
      else if (action.id === REMOVE_RESOURCE_ELEMENT_ACTION) {
        /// Remove bpmn:resource element
	var resourceElement = resourceHelper.getResource(action.value);
        commands.push(cmdHelper.removeElementsFromList(definitions, definitions, 'rootElements', 'resource',  [ resourceElement ]));
      }
      // unselect last child element because panel can only be updated by manually selecting the element ?!?
//      (getSelectBox(node, id).lastChild || {}).selected = '';
//console.warn(commands);
      return commands;
    },

    createListEntryTemplate: function(value, index, selectBox) {
      initSelectionSize(selectBox, selectBox.options.length + 1);
      return createOption(value.resourceElementValue);
    },

    deselect: function(element, node) {
      var selectBox = getSelectBox(node, id);
      selectBox.selectedIndex = -1;
    },

    getSelected: function(element, node) {
      return getSelected(node, id);
    },

    setControlValue: function(element, node, option, property, value, idx) {
      node.value = value;

      if (!setOptionLabelValue) {
        node.text = value;
      } else {
        setOptionLabelValue(modeler.getDefinitions(), node, option, property, value, idx);
      }
    },

    createElement: function(element, node) {
//console.log("ResourceElement:createElement",element,node);
      // create option template
      var generatedId = generateElementId(prefix);

      var selectBox = getSelectBox(node, id);
      var template = domify(createOption(generatedId));

      // add new empty option as last child element
      selectBox.appendChild(template);

      // select last child element
      selectBox.lastChild.selected = 'selected';
      selectionChanged(modeler.getDefinitions(), node);

      // update select box size
      initSelectionSize(selectBox, selectBox.options.length);

      this.__action = {
        id: CREATE_RESOURCE_ELEMENT_ACTION,
        value: generatedId
      };
//console.log("ACTION",this.__action);
      return true;
    },

    removeElement: function(element, node) {
//console.log("ResourceElement:removeElement",node);
      var selection = getSelected(node, id);
      var selectBox = getSelectBox(node, id);
      selectBox.removeChild(selectBox.options[selection.idx]);

      // update select box size
      initSelectionSize(selectBox, selectBox.options.length);

      this.__action = {
        id: REMOVE_RESOURCE_ELEMENT_ACTION,
        value: selection.value,
        idx: selection.idx
      };
//console.log("ACTION",this.__action);
      return true;
    },

    hideElements: function(element, entryNode, node, scopeNode) {
      return !hideElements(element, entryNode, node, scopeNode);
    },

    disableRemove: function(element, entryNode, node, scopeNode) {
      return (getSelected(entryNode, id) || {}).idx < 0;
    },

    selectElement: selectionChanged
  };

};

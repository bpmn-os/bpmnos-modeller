import {
  is,
  getBusinessObject
} from 'bpmn-js/lib/util/ModelUtil';

export default class ResourceElementsPopupMenu {
  constructor(popupMenu, bpmnReplace) {
    popupMenu.registerProvider("bpmn-replace", this);
    this.replaceElement = bpmnReplace.replaceElement;
  }

  getPopupMenuHeaderEntries(element) {
    return function (entries) {
      if ( element.type == 'bpmn:SubProcess' ) {
        var businessObject = getBusinessObject(element);
        if ( businessObject.type == 'Resource' || businessObject.type == 'Request' || businessObject.type == 'Release' ) {
          // Remove all header entries (i.e. multi-instance and loop)
          return {};
        }
      }
      return entries;
    };
  }

  getPopupMenuEntries(element) {
    const self = this;
    return function (entries) {
      if ( element.type == 'bpmn:SubProcess' ) {
        var businessObject = getBusinessObject(element);
        if ( businessObject.type == 'Resource' || businessObject.type == 'Request' || businessObject.type == 'Release' ) {
          // Remove all header entries (i.e. multi-instance and loop)
          return {};
        }
      }
      return entries;
    };
  }
}

ResourceElementsPopupMenu.$inject = ["popupMenu", "bpmnReplace"];


import {
  is,
  getBusinessObject
} from 'bpmn-js/lib/util/ModelUtil';

export default class JobPopupMenu {
  constructor(popupMenu, bpmnReplace) {
    popupMenu.registerProvider("bpmn-replace", this);
    this.replaceElement = bpmnReplace.replaceElement;
  }

  getPopupMenuHeaderEntries(element) {
    return function (entries) {
      // Remove all header entries (i.e. multi-instance and loop)
      return {};
    };
  }

  getPopupMenuEntries(element) {
    const self = this;
    return function (entries) {
      if ( element.type == 'bpmn:Task' || element.type == 'bpmn:SubProcess' ) {
        var businessObject = getBusinessObject(element);
        if ( businessObject.$parent && businessObject.$parent.type == "JobShop") {
          // Remove typed tasks, transaction, call activity
          var allowed = [ "replace-with-collapsed-subprocess", "replace-with-expanded-subprocess", "replace-with-task" ];
          for (var key in entries) {
            if ( !allowed.includes(key) ) {
              delete entries[key]
            }
          }
        }
      }
      return entries;
    };
  }
}

JobPopupMenu.$inject = ["popupMenu", "bpmnReplace"];


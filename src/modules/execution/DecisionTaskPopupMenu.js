import {
  is,
  isAny,
  getBusinessObject
} from 'bpmn-js/lib/util/ModelUtil';

export default class DecisionTaskPopupMenu {
  constructor(popupMenu, bpmnReplace) {
    popupMenu.registerProvider("bpmn-replace", this);
    this.replaceElement = bpmnReplace.replaceElement;
  }

  getPopupMenuHeaderEntries(element) {
    return function (entries) {
      return entries;
    };
  }

  getPopupMenuEntries(element) {
    const self = this;
    return function (entries) {
      if ( is(element, "bpmn:Activity") 
           && !(is(element, "bpmn:SubProcess") && element.collapsed == false ) 
           && element.businessObject.type != 'Decision' 
      ) {
        entries = {
          "replace-with-decision-task": {
            label: "Decision Task",
            className: "bpmn-icon-decision-task",
            action: function () {
              var businessObject = element.businessObject;
              businessObject.type = 'Decision';
              var replaceElement = self.replaceElement(element, {
                type: "bpmn:Task",
                businessObject
              });
              return replaceElement;
            }
          },
          ...entries
        };
      }
      else if ( is(element, "bpmn:Task") && element.businessObject.type == 'Decision' ) {
        entries = {
          "replace-with-task": {
            label: "Task",
            className: "bpmn-icon-task",
            action: function () {
              var businessObject = element.businessObject;
              delete businessObject.type;
              var replaceElement = self.replaceElement(element, {
                type: "bpmn:Task",
                businessObject
              })
              return replaceElement;
            }
          }
        };
      }
      return entries;
    };
  }
}

DecisionTaskPopupMenu.$inject = ["popupMenu", "bpmnReplace"];


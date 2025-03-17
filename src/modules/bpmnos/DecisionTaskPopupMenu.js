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

    const untypedTask = {
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
    };

    const decisionTask = {
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
    };

    return function (entries) {
     if ( is(element, "bpmn:Activity") && element.collapsed != false )  {
        entries = {
          "replace-with-task": untypedTask,
          "replace-with-decision-task": decisionTask,
          ...entries
        };
      }
      if ( element.type == "bpmn:Task" ) {
        if ( element.businessObject.type == 'Decision' ) {
          delete entries["replace-with-decision-task"];
        }
        else {
          delete entries["replace-with-task"];
        }
      }
      return entries;
    };
  }
}

DecisionTaskPopupMenu.$inject = ["popupMenu", "bpmnReplace"];


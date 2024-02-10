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
      if ( element.type == "bpmn:Task"
           && element.businessObject.type != 'Decision' 
      ) {
        if ( element.businessObject.$parent.type != 'JobShop' ) {
          // add decision task as option for task
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
      }
      else if ( element.type == "bpmn:Task" 
           && element.businessObject.type == 'Decision' 
      ) {
        // provide task as option for decision task
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
      else if ( is(element, "bpmn:Task") 
           && !is(element, "bpmn:CallActivity")
      ) {
        // only allow tasks as option for typed task
        let forbidden = ["replace-with-call-activity","replace-with-collapsed-subprocess","replace-with-expanded-subprocess"];
        for (var key in entries) {
          if ( forbidden.includes(key) ) {
            delete entries[key];
          }
        }

        let taskEntry = entries["replace-with-task"];
        delete entries["replace-with-task"];

        entries = {
          taskEntry,
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
      else if ( is(element, "bpmn:CallActivity") ||
                ( is(element, "bpmn:SubProcess") && element.collapsed != false )
      ) {
        // do not allow typed tasks as option for subprocess
        let allowed = ["replace-with-task","replace-with-call-activity","replace-with-collapsed-subprocess","replace-with-expanded-subprocess"];
        for (var key in entries) {
          if ( !allowed.includes(key) ) {
            delete entries[key];
          }
        }
      }

      return entries;
    };
  }
}

DecisionTaskPopupMenu.$inject = ["popupMenu", "bpmnReplace"];


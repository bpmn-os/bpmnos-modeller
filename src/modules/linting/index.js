import { createLintConfig } from "./create-lint-config";

import implicitStart from "./bpmn/implicit-start";
import implicitEnd from "./bpmn/implicit-end";
import noBlankEvent from "./bpmn/no-blank-event";
import implicitSplit from "./bpmn/implicit-split";
import implicitJoin from "./bpmn/implicit-join";
import conditionalFlow from "./bpmn/conditional-flow";
import loop from "./bpmn/loop";
import structuralAnomaly from "./bpmn/structural-anomaly";
import singleBlankStartEvent from "bpmnlint/rules/single-blank-start-event";
import subProcessBlankStartEvent from "bpmnlint/rules/sub-process-blank-start-event";
import noDuplicateSequenceFlows from "bpmnlint/rules/no-duplicate-sequence-flows";
import superfluousGateway from "bpmnlint/rules/superfluous-gateway";


import nonExecutableProcess from "./engine/non-executable-process";
import activityMarker from "./engine/activity-marker";
import typedTask from "./engine/typed-task";
import boundaryEvent from "./engine/boundary-event";
import eventType from "./engine/event-type";
import multipleEventDefinitions from "./engine/multiple-event-definitions";
import eventSubprocess from "./engine/event-subprocess";
import compensationActivity from "./engine/compensation-activity";

import callActivity from "./engine/call-activity";
import transaction from "./engine/transaction";
import complexGateway from "./engine/complex-gateway";
import inclusiveGateway from "./engine/inclusive-gateway";
//import conditionalFlow from "./engine/conditional-flow";

            
import defaultattributes from"./execution/default-attributes";
import attributeRedeclared from "./execution/attribute-redeclared"; 
import attributeUndeclared from "./execution/attribute-undeclared"; 
import gatekeeperRestrictions from "./execution/gatekeeper-restrictions";
import allocation from "./execution/allocation";

export default function() {
  return createLintConfig({
      rules: {
        "essential/implicit-start": "error",
        "essential/implicit-end": "error",
        "essential/no-blank-event": "error",
        "essential/implicit-split": "error",
        "essential/implicit-join": "error",
        "essential/conditional-flow": "error",
        "essential/loop": "error",
        "essential/structural-anomaly": "error",
        "essential/single-blank-start-event": "error",
        "essential/sub-process-blank-start-event": "error",
        "essential/no-duplicate-sequence-flows": "error",
        "essential/superfluous-gateway": "warn",
        "engine/non-executable-process": "warn",
        "engine/boundary-event": "warn",
        "engine/event-subprocess": "warn",
        "engine/activity-marker": "error",
        "engine/typed-task": "error",
        "engine/event-type": "error",
        "engine/multiple-event-definitions": "error",
        "engine/compensation-activity": "error",
        "engine/call-activity": "error",
        "engine/transaction": "error",
        "engine/complex-gateway": "error",
        "engine/inclusive-gateway": "error",
//        "engine/conditional-flow": "error",
        "execution/default-attributes": "error",
        "execution/attribute-redeclared": "error",
        "execution/attribute-undeclared": "error",
        "execution/gatekeeper-restrictions": "error",
        "execution/allocation": "error"
      },
      plugins: [
        {
          name: "essential",
          rules: {
            "implicit-start": implicitStart,
            "implicit-end": implicitEnd,
            "no-blank-event": noBlankEvent,
            "implicit-split": implicitSplit,
            "implicit-join": implicitJoin,
            "conditional-flow": conditionalFlow,
            "loop": loop,
            "structural-anomaly": structuralAnomaly,
            "single-blank-start-event": singleBlankStartEvent,
            "sub-process-blank-start-event": subProcessBlankStartEvent,
            "no-duplicate-sequence-flows": noDuplicateSequenceFlows,
            "superfluous-gateway": superfluousGateway
          }
        },
        {
          name: "engine",
          rules: {
            "non-executable-process": nonExecutableProcess,
            "boundary-event": boundaryEvent,
            "event-subprocess": eventSubprocess,
            "activity-marker": activityMarker,
            "typed-task": typedTask,
            "event-type": eventType,
            "multiple-event-definitions": multipleEventDefinitions,
            "compensation-activity": compensationActivity,
            "call-activity": callActivity,
            "transaction": transaction,
            "complex-gateway": complexGateway,
            "inclusive-gateway": inclusiveGateway,
            "conditional-flow": conditionalFlow
          }
        },
        {
          name: "execution",
          rules: {
            "default-attributes": defaultattributes,
            "attribute-redeclared": attributeRedeclared,
            "attribute-undeclared": attributeUndeclared,
            "gatekeeper-restrictions": gatekeeperRestrictions,
            "allocation": allocation
          }
        }
      ]
    })
};


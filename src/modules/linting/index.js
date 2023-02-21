import { createLintConfig } from "./create-lint-config";

import implicitStart from "./bpmnlint-plugin-basic/rules/implicit-start";
import implicitEnd from "./bpmnlint-plugin-basic/rules/implicit-end";
import noBlankEvent from "./bpmnlint-plugin-basic/rules/no-blank-event";

// from https://github.com/bpmn-io/bpmnlint
import subProcessBlankStartEvent from "./bpmnlint-plugin-basic/rules/sub-process-blank-start-event";
import noDuplicateSequenceFlows from "./bpmnlint-plugin-basic/rules/no-duplicate-sequence-flows";
import noImplicitSplit from "./bpmnlint-plugin-basic/rules/no-implicit-split";
import fakeJoin from "./bpmnlint-plugin-basic/rules/fake-join";
import superfluousGateway from "./bpmnlint-plugin-basic/rules/superfluous-gateway";

import nonExecutableProcess from "./bpmnlint-plugin-extended/rules/non-executable-process";
import activityMarker from "./bpmnlint-plugin-extended/rules/activity-marker";
import typedTask from "./bpmnlint-plugin-extended/rules/typed-task";
import boundaryEvent from "./bpmnlint-plugin-extended/rules/boundary-event";
import eventType from "./bpmnlint-plugin-extended/rules/event-type";
import singleEventDefinition from "./bpmnlint-plugin-extended/rules/single-event-definition";
import eventSubprocess from "./bpmnlint-plugin-extended/rules/event-subprocess";
import callActivity from "./bpmnlint-plugin-extended/rules/call-activity";
import complexGateway from "./bpmnlint-plugin-extended/rules/complex-gateway";
import inclusiveGateway from "./bpmnlint-plugin-extended/rules/inclusive-gateway";


export default function() {
  return createLintConfig({
      rules: {
        "basic/implicit-start": "error",
        "basic/implicit-end": "error",
        "basic/no-blank-event": "error",
        "basic/sub-process-blank-start-event": "error",
        "basic/no-duplicate-sequence-flows": "error",
        "basic/no-implicit-split": "error",
        "basic/fake-join": "error",
        "basic/superfluous-gateway": "warn",
        "extended/non-executable-process": "warn",
        "extended/activity-marker": "error",
        "extended/typed-task": "error",
        "extended/boundary-event": "error",
        "extended/event-type": "error",
        "extended/single-event-definition": "error",
        "extended/event-subprocess": "error",
        "extended/call-activity": "error",
        "extended/complex-gateway": "error",
        "extended/inclusive-gateway": "error"
      },
      plugins: [
        {
          name: "basic",
          rules: {
            "implicit-start": implicitStart,
            "implicit-end": implicitEnd,
            "no-blank-event": noBlankEvent,
            "sub-process-blank-start-event": subProcessBlankStartEvent,
            "no-duplicate-sequence-flows": noDuplicateSequenceFlows,
            "no-implicit-split": noImplicitSplit,
            "fake-join": fakeJoin,
            "superfluous-gateway": superfluousGateway
          }
        },
        {
          name: "extended",
          rules: {
            "non-executable-process": nonExecutableProcess,
            "activity-marker": activityMarker,
            "typed-task": typedTask,
            "boundary-event": boundaryEvent,
            "event-type": eventType,
            "single-event-definition": singleEventDefinition,
            "event-subprocess": eventSubprocess,
            "call-activity": callActivity,
            "complex-gateway": complexGateway,
            "inclusive-gateway": inclusiveGateway
          }
        }
      ]
    })
};

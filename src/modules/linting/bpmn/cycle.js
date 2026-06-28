const {
  is
} = require('bpmnlint-utils');

// Warns on any cycle in the sequence flow: BPMN-OS prefers loop activities over cyclic
// control flow. Detected per flow-elements container (process / subprocess) via a DFS that
// flags back edges (a sequence flow returning to a node still on the current DFS stack).
// This subsumes the former self-loop "loop" rule (a self-loop is just a length-1 cycle).
module.exports = function () {
  function check(node, reporter) {
    if (!is(node, 'bpmn:FlowElementsContainer')) {
      return;
    }

    const flowElements = node.flowElements || [];

    // adjacency: sourceId -> [{ target, flow }]
    const successors = {};
    flowElements.forEach(function (fe) {
      if (is(fe, 'bpmn:SequenceFlow') && fe.sourceRef && fe.targetRef) {
        (successors[fe.sourceRef.id] = successors[fe.sourceRef.id] || [])
          .push({ target: fe.targetRef.id, flow: fe.id });
      }
    });

    const WHITE = 0, GREY = 1, BLACK = 2;
    const color = {};
    const backEdges = [];

    function visit(id) {
      color[id] = GREY;
      (successors[id] || []).forEach(function (edge) {
        const c = color[edge.target] || WHITE;
        if (c === GREY) {
          backEdges.push(edge.flow);   // edge closes a cycle
        } else if (c === WHITE) {
          visit(edge.target);
        }
      });
      color[id] = BLACK;
    }

    flowElements.forEach(function (fe) {
      if (is(fe, 'bpmn:FlowNode') && !color[fe.id]) {
        visit(fe.id);
      }
    });

    backEdges.forEach(function (flowId) {
      reporter.report(flowId, 'Use loop activities instead of cycles');
    });
  }

  return {
    check
  };
};

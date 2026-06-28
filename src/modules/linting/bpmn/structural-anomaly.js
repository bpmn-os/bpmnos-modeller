const {
  is,
  isAny
} = require('bpmnlint-utils');

/************************************************/
/* Detects asymmetric gateways, deadlocks,      */
/* token loss and other structural anomalies.   */
/*                                              */
/* Reachability is not checked: in an acyclic   */
/* model every node traces back to a start, so  */
/* unreachable nodes can only arise from cycles */
/* (flagged by the `cycle` rule).               */
/*                                              */
/* Assumes an ACYCLIC model with only           */
/* INTERRUPTING boundary events. Cycles and     */
/* non-interrupting boundary events are flagged */
/* by the dedicated `cycle` and                 */
/* `non-interrupting-boundary-event` rules, so  */
/* this rule no longer handles them (which is   */
/* why the former loop reduction and the        */
/* non-interrupting submodel analysis are gone).*/
/************************************************/

/*
The model is turned into a directed acyclic graph via a topological sort. Each node carries
its fork/merge behaviour (EXCLUSIVE, PARALLEL, INCLUSIVE, COMPLEX) and an initially empty set
of `escapes`. Reduction rules are then applied repeatedly to identify deadlocks, races and
asymmetric gateways:

- Intermediate nodes (one predecessor, one successor) are removed.
- Parallel/alternative end nodes hanging off a fork are removed (alternative ends contribute
  an escape).
- Multiple flows between the same fork and merge are collapsed (and reported if the fork and
  merge behaviour disagree).
- Single-entry/single-exit blocks between a fork and a matching merge are replaced by a direct
  link; inconsistent forks/merges, deadlocks and possible token loss are reported.

When no further reduction applies, start/end nodes are removed and any remaining node is
reported as a structural anomaly.
*/

module.exports = function () {

  let DEBUG = false;
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    DEBUG = urlParams.has('debug');
  }

  // Gateway types
  const EXCLUSIVE = 1, PARALLEL = 2, INCLUSIVE = 3, COMPLEX = 4;

  // Modes for reducing acyclic connected blocks
  const Mode = {
    HOMOGENEOUS: 0,
    PARALLEL: 1,
    FORCED_PARALLEL: 2,
    INCLUSIVE: 3,
    INCONSISTENT: 4
  }

  let graph = {};

  function check(node, reporter) {
    if ( is(node,'bpmn:FlowElementsContainer') ) {
      const flowElements = node.flowElements || [];

      // determine starting nodes
      const startingNodes = flowElements.filter(function(flowElement) {
        return is(flowElement, 'bpmn:FlowNode')
               && (!flowElement.incoming || flowElement.incoming.length == 0)
               && (!is(flowElement, 'bpmn:SubProcess') || !flowElement.triggeredByEvent)
               && !flowElement.isForCompensation
               && !is(flowElement, 'bpmn:BoundaryEvent');
      });

      // boundary events are assumed interrupting (non-interrupting ones are flagged by the
      // non-interrupting-boundary-event rule)
      const boundaryEvents = flowElements.filter(e => is(e, 'bpmn:BoundaryEvent'));

      graph = buildAcyclicGraph( startingNodes, boundaryEvents );
      if ( DEBUG ) console.log("Initial", startingNodes, graph);

      validate( graph, reporter );
      if ( DEBUG ) console.log("Final", graph);
    }
  }
  return {
    check
  };

/************************************************/
/** Validate                                   **/
/************************************************/

  function validate( graph, reporter ) {
    simplifyGraph( graph, reporter );

    for (let id in graph) {
      reporter.report(id, 'Structural anomaly');
    }
  }

/************************************************/
/** Build acyclic graph                        **/
/************************************************/

  function buildAcyclicGraph( nodes, boundaryEvents ) {
    let graph = {};
    let initialNodes = [...nodes];
    while ( nodes.length ) {
      let i = select(nodes, graph);
      if ( i == undefined ) {
        // an acyclic model always admits a topological order; guard against an
        // unexpected cycle so we never loop forever
        if ( DEBUG ) console.error("No topological order found (unexpected cycle)");
        break;
      }
      insert( nodes, i, boundaryEvents, graph );
    }

    if ( initialNodes.length ) {
      // create a super start node joining all start nodes
      let parent = initialNodes[0].$parent;
      graph[parent.id] = {
        node: parent,
        successors: [],
        predecessors: [],
        merge: undefined,
        fork: initialNodes.length > 1 ? EXCLUSIVE : undefined,
        escapes: []
      };
      for ( let i in initialNodes ) {
        let node = initialNodes[i];
        graph[node.id].predecessors.push(parent.id);
        graph[parent.id].successors.push(node.id);
      }
    }

    return graph;
  }

  function select(nodes, graph) {
    // select a node that doesn't have any incoming arc from nodes yet to be included
    for (let i in nodes) {
      let selected = true;
      if ( nodes[i].incoming ) {
        for (let j in nodes[i].incoming ) {
          const incomingId = nodes[i].incoming[j].sourceRef.id;
          if ( incomingId != nodes[i].id
               && graph[ incomingId ] == undefined
          ) {
            selected = false;
            break;
          }
        }
      }
      if ( is(nodes[i],'bpmn:BoundaryEvent')
           && graph[ nodes[i].attachedToRef.id ] == undefined
      ) {
        // do not select a boundary event before its activity is included
        selected = false;
      }
      if ( selected ) {
        return i;
      }
    }
    return;
  }

  function insert( nodes, i, boundaryEvents, graph) {
    const node = nodes[i];
    graph[node.id] = {
      node,
      successors: [],
      predecessors: [],
      merge: getMergeBehaviour(node, boundaryEvents),
      fork: getForkBehaviour(node, boundaryEvents),
      escapes: []
    };

    update(graph, node);
    nodes.splice(i, 1);

    // add subsequent nodes
    if ( node.outgoing ) {
      for (let j in node.outgoing ) {
        let successor = node.outgoing[j].targetRef;
        if ( graph[successor.id] == undefined && !nodes.includes(successor) ) {
          nodes.push(successor);
        }
      }
    }

    // add attached boundary event nodes
    const attachedBoundaryEvents = boundaryEvents.filter( e => e.attachedToRef.id == node.id);
    for (let j in attachedBoundaryEvents ) {
      nodes.push(attachedBoundaryEvents[j]);
    }
  }

  function update(graph, node) {
    // update predecessors and successors after insertion
    if ( node.incoming && node.incoming.length ) {
      for ( let i in node.incoming) {
        let predecessorId = node.incoming[i].sourceRef.id;
        if ( predecessorId == node.id ) {
          // ignore self-links (reported by the cycle rule)
        }
        else if ( graph[predecessorId] ) {
          if ( graph[node.id].predecessors.indexOf(predecessorId) == -1 ) {
            graph[node.id].predecessors.push(predecessorId);
          }
          if ( graph[predecessorId].successors.indexOf(node.id) == -1 ) {
            graph[predecessorId].successors.push(node.id);
          }
        }
      }
    }
    else if ( is(node,'bpmn:BoundaryEvent') ) {
      let predecessorId = node.attachedToRef.id;
      graph[node.id].predecessors.push(predecessorId);
      graph[predecessorId].successors.push(node.id);
    }
  }

  function getMergeBehaviour( node ) {
    let merge = undefined;
    if ( is(node,'bpmn:ExclusiveGateway') ) {
       if ( node.incoming && node.incoming.length > 1) merge = EXCLUSIVE;
    }
    else if ( is(node,'bpmn:ParallelGateway') ) {
       if ( node.incoming && node.incoming.length > 1) merge = PARALLEL;
    }
    else if ( is(node,'bpmn:InclusiveGateway') ) {
       if ( node.incoming && node.incoming.length > 1) merge = INCLUSIVE;
    }
    else if ( is(node,'bpmn:ComplexGateway') ) {
       if ( node.incoming && node.incoming.length > 1) merge = COMPLEX;
    }
    else {
       // all other nodes with multiple incoming arcs behave like exclusive gateways
       if ( node.incoming && node.incoming.length > 1) merge = EXCLUSIVE;
    }

    return merge;
  }

  function getForkBehaviour( node, boundaryEvents ) {
    let fork = undefined;
    if ( isAny(node,['bpmn:ExclusiveGateway','bpmn:EventBasedGateway']) ) {
       if ( node.outgoing && node.outgoing.length > 1 ) return fork = EXCLUSIVE;
    }
    else if ( is(node,'bpmn:ParallelGateway') ) {
       if ( node.outgoing && node.outgoing.length > 1 ) return fork = PARALLEL;
    }
    else if ( is(node,'bpmn:InclusiveGateway') ) {
       if ( node.outgoing && node.outgoing.length > 1 ) return fork = INCLUSIVE;
    }
    else if ( is(node,'bpmn:ComplexGateway') ) {
       if ( node.outgoing && node.outgoing.length > 1 ) return fork = COMPLEX;
    }
    else if ( isAny(node,['bpmn:SubProcess','bpmn:Activity'])
              && boundaryEvents.filter( e => e.attachedToRef.id == node.id ).length > 0
    ) {
      // activities with interrupting boundary events behave like complex gateways when they
      // also have multiple outgoing arcs, and like exclusive gateways with a single one
      if ( node.outgoing && node.outgoing.length > 1 ) return fork = COMPLEX;
      if ( node.outgoing && node.outgoing.length == 1 ) return fork = EXCLUSIVE;
    }
    else {
      // all other nodes with multiple outgoing arcs behave like parallel gateways
      if ( node.outgoing && node.outgoing.length > 1 ) return fork = PARALLEL;
    }

    return fork;
  }

/************************************************/
/** Simplify graph                             **/
/************************************************/
  function simplifyGraph( graph, reporter ) {
    while ( removeMultipleFlowsBetweenGateways(graph, reporter)
            || removeIntermediateNodes(graph, reporter)
            || removeTrailingEnd(graph, reporter)
            || removeParallelEnd(graph, reporter)
            || removeAlternativeEnds(graph, reporter)
            || removeAcyclicConnectedBlock(graph, reporter, Mode.HOMOGENEOUS)
            || removeAcyclicConnectedBlock(graph, reporter, Mode.PARALLEL)
            || removeAcyclicConnectedBlock(graph, reporter, Mode.FORCED_PARALLEL)
            || removeAcyclicConnectedBlock(graph, reporter, Mode.INCLUSIVE)
            || removeAcyclicConnectedBlock(graph, reporter, Mode.INCONSISTENT)
    ) {
      if ( DEBUG ) console.log("Graph", graph);
    }
    removeStart(graph, reporter)
  }

  function removeSequentialNode( graph, id ) {
    if ( DEBUG ) console.log("Remove node", id);
    let predecessorId = graph[id].predecessors.length == 1 ? graph[id].predecessors[0] : undefined;
    let successorId = graph[id].successors.length == 1 ? graph[id].successors[0] : undefined;

    if ( predecessorId && graph[predecessorId] ) {
      // redirect arc from predecessor to new successor
      graph[predecessorId].successors = graph[predecessorId].successors.filter(e => e !== id);
      if ( successorId ) {
        graph[predecessorId].successors.push(successorId);
      }
    }

    if ( successorId && graph[successorId] ) {
      if ( predecessorId ) {
        for ( var i=0; i < graph[successorId].predecessors.length; i++) {
          if ( graph[successorId].predecessors[i] == id ) {
            graph[successorId].predecessors[i] = predecessorId;
          }
        }
      }
      else {
        graph[successorId].predecessors = graph[successorId].predecessors.filter(e => e !== id);
      }
    }

    delete graph[id];
  }

  function removeIntermediateNodes(graph, reporter) {
    let REMOVAL = false;
    for (let id in graph) {
      if ( graph[id].predecessors.length == 1
           && graph[id].successors.length == 1
      ) {
        if ( !graph[id].escapes.length ) {
          removeSequentialNode( graph, id );
          REMOVAL = true;
        }
        else if ( !graph[ graph[id].predecessors[0] ].fork ) {
          const predecessorId = graph[id].predecessors[0];
          mergeUnique( graph[predecessorId].escapes, graph[id].escapes);
          removeSequentialNode( graph, id );
          REMOVAL = true;
        }
      }
    }
    return REMOVAL;
  }

  function removeTrailingEnd(graph, reporter) {
    let REMOVAL = false;
    for (let id in graph) {
      if ( graph[id].predecessors.length <= 1
           && graph[id].successors.length == 0
      ) {
        if ( graph[id].predecessors.length == 1 ) {
          let predecessorId = graph[id].predecessors[0];
          if ( graph[predecessorId].fork ) {
            return;
          }
        }
        removeSequentialNode( graph, id );
        REMOVAL = true;
      }
    }
    return REMOVAL;
  }

  function removeParallelEnd(graph, reporter) {
    let REMOVAL = false;
    for (let id in graph) {
      if ( graph[id].successors.length == 0
           && graph[id].predecessors.length == 1
      ) {
        const predecessorId = graph[id].predecessors[0];
        if ( graph[predecessorId].fork == PARALLEL ) {
          removeSequentialNode( graph, id );
          REMOVAL = true;
        }
      }
    }
    return REMOVAL;
  }

  function removeAlternativeEnds(graph, reporter) {
    let REMOVAL = false;
    for (let id in graph) {
      if ( graph[id].fork && graph[id].fork != PARALLEL ) {
        let alternativeEnds = graph[id].successors.filter(function(successorId) {
          // A node with a merge (>= 2 incoming) is a join, not an alternative end. Do not
          // dissolve it here: it must survive until its block is reduced, otherwise an
          // exclusive merge fed by concurrent branches (a race) would be lost.
          return ( graph[successorId].successors.length == 0
                   && !graph[successorId].merge );
        });
        // remove all alternative ends
        for (var i = 0; i < alternativeEnds.length; i++) {
          let endId = alternativeEnds[i];
          if ( graph[endId].predecessors.length > 1 ) {
            // only remove arc
            graph[id].successors = graph[id].successors.filter(e => e !== endId);
            if ( graph[id].successors.length == 1 ) {
              graph[id].fork = undefined;
            }
            graph[endId].predecessors = graph[endId].predecessors.filter(e => e !== id);
            if ( graph[endId].predecessors.length == 1 ) {
              graph[endId].merge = undefined;
            }
            if ( DEBUG ) console.log("Remove arc", id, endId);
          }
          else {
            removeSequentialNode( graph, endId );
          }
          REMOVAL = true;
        }
        if ( alternativeEnds.length > 0 ) {
          graph[id].escapes.push(id);
          if ( graph[id].successors.length <= 1 ) {
            graph[id].fork = undefined;
          }
        }
      }
    }
    return REMOVAL;
  }

  function removeMultipleFlowsBetweenGateways(graph, reporter) {
    let REMOVAL = false;
    for (let id in graph) {
      const nodeId = graph[id].node.id;
      if ( graph[id].merge ) {
        const merging = graph[id].predecessors.filter((e, i, a) => a.indexOf(e) !== i);
        for ( let i in merging ) {
          const predecessorId = merging[i];
          if ( graph[id].predecessors.filter(e => e == predecessorId).length > 1 ) {
            if ( DEBUG ) console.log("Remove multiple flows between", predecessorId, id);

            if ( graph[predecessorId].fork != graph[id].merge ) {
              if ( graph[predecessorId].predecessors.length ) {
                reporter.report(nodeId, "Not symmetric with '" + predecessorId + "'");
                reporter.report(predecessorId, "Not symmetric with '" + nodeId + "'");
              }
              else {
                reporter.report(nodeId, "Non-exclusive merge of alternative flows");
              }
            }

            // only keep one flow between nodes
            graph[predecessorId].successors = graph[predecessorId].successors.filter(e => e != id);
            graph[id].predecessors = graph[id].predecessors.filter(e => e != predecessorId);
            graph[predecessorId].successors.push(id);
            graph[id].predecessors.push(predecessorId);

            if ( graph[predecessorId].successors.length <= 1 ) {
              graph[predecessorId].fork = undefined;
            }
            if ( graph[id].predecessors.length <= 1 ) {
              graph[id].merge = undefined;
            }
            REMOVAL = true;
          }
        }
      }
    }
    return REMOVAL;
  }

  function removeAcyclicConnectedBlock(graph, reporter, mode) {
    let REMOVAL = false;
    for (let startId in graph) {
      if ( graph[startId].fork ) {
        for (let endId in graph) {
          if ( graph[endId].merge ) {
            let block = findAcyclicConnectedBlock(startId, endId, graph, mode);
            if ( block ) {
              switch(mode) {
                case Mode.HOMOGENEOUS:
                  // Nothing to report
                  updateBlockEscapes(block,graph);
                  if ( DEBUG ) console.log("Remove homogeneous block", block);
                  break;
                case Mode.PARALLEL:
                  if ( !validateParallelBlock(block,graph) ) {
                    // Block is inconsistent
                    continue;
                  };
                  if ( DEBUG ) console.log("Remove parallel block", block);
                  // Nothing to report for consistent blocks
                  break;
                case Mode.FORCED_PARALLEL:
                  // Report inconsistencies
                  validateParallelBlock(block,graph,reporter);
                  if ( DEBUG ) console.log("Remove inconsistent parallel block", block);
                  break;
                case Mode.INCLUSIVE:
                  // Nothing to report
                  updateBlockEscapes(block,graph);
                  if ( DEBUG ) console.log("Remove inclusive block", block);
                  break;
                case Mode.INCONSISTENT:
                  // Report inconsistencies
                  if ( graph[startId].predecessors.length ) {
                    reporter.report(graph[endId].node.id,"Inconsistent block starting with '" + startId + "'");
                    reporter.report(startId,"Inconsistent block ending with '" + graph[endId].node.id + "'");
                  }
                  else {
                    reporter.report(graph[endId].node.id,"Inconsistent initial block");
                  }
                  if ( DEBUG ) console.log("Remove inconsistent block", block);
                  break;
                default:
              }

              // remove all nodes between startId and endId
              for ( let i in block ) {
                let nodeId = block[i];
                if ( nodeId != startId && nodeId != endId ) {
                  graph[startId].successors = graph[startId].successors.filter(e => e != nodeId);
                  graph[endId].predecessors = graph[endId].predecessors.filter(e => e != nodeId);
                  delete graph[nodeId];
                  REMOVAL = true;
                }
              }
              if ( REMOVAL ) {
                // ensure there is a flow between start and end of structure
                if ( !graph[startId].successors.includes(endId) ) {
                  graph[startId].successors.push(endId);
                }
                if ( !graph[endId].predecessors.includes(startId) ) {
                  graph[endId].predecessors.push(startId);
                }
                if ( graph[startId].successors.length <= 1 ) {
                  graph[startId].fork = undefined;
                }
                if ( graph[endId].predecessors.length <= 1 ) {
                  graph[endId].merge = undefined;
                }
                return REMOVAL;
              }
            }
          }
        }
      }
    }
    return false;
  }

  function findAcyclicConnectedBlock(startId, endId, graph, mode) {
    switch(mode) {
      case Mode.HOMOGENEOUS:
        if ( graph[endId].merge != graph[startId].fork) return;
        break;
      case Mode.PARALLEL:
      case Mode.FORCED_PARALLEL:
        if ( graph[startId].fork != PARALLEL) return;
        break;
      case Mode.INCLUSIVE:
        if ( graph[endId].fork != INCLUSIVE) return;
        break;
      default:
    }

    let block = [ startId ];
    let successors = [];
    for ( let j in graph[startId].successors ) {
      const successorId = graph[startId].successors[j];
      if ( !successors.includes(successorId) ) {
        successors.push(successorId);
      }
    }

    while ( successors.length > 0 ) {
      let nodeId;
      if ( successors.length > 1 || successors[0] != endId ) {
        nodeId = successors.find(i =>
          i != endId
          && graph[i].predecessors.every(el => block.includes(el))
        );

        if ( nodeId == undefined ) {
          return;
        }

        if ( mode == Mode.HOMOGENEOUS
             && graph[startId].fork == PARALLEL
             && graph[nodeId].escapes.length
        ) {
          return;
        }
      }
      else {
        nodeId = endId;
      }

      switch(mode) {
        case Mode.HOMOGENEOUS:
          if ( graph[nodeId].merge && graph[nodeId].merge != graph[startId].fork ) return;
          if ( nodeId != endId && graph[nodeId].fork && graph[nodeId].fork != graph[startId].fork ) return;
          break;
        case Mode.PARALLEL:
          if ( graph[nodeId].merge && ( graph[nodeId].merge != INCLUSIVE && graph[nodeId].merge != PARALLEL ) ) return;
          // do not break and continue with FORCED_PARALLEL
        case Mode.FORCED_PARALLEL:
          if ( nodeId != endId && graph[nodeId].fork && graph[nodeId].fork != PARALLEL ) return;
          break;
        case Mode.INCLUSIVE:
          if ( graph[nodeId].merge && graph[nodeId].merge != INCLUSIVE ) return;
          break;
        default:
      }

      // add node to block
      block.push(nodeId);
      // remove node from successors
      successors = successors.filter(item => item !== nodeId);
      // add new successors
      if ( nodeId != endId ) {
        for ( let j in graph[nodeId].successors ) {
          const successorId = graph[nodeId].successors[j];
          if ( !successors.includes(successorId) ) {
            successors.push(successorId);
          }
        }
      }
    }
    // each block must contain at least start and end node
    if ( block.length <= 2 ) return;
    // each block must merge flows at end node
    if ( graph[endId].predecessors.filter(el => block.includes(el)).length < 2 ) return;

    return block;
  }

  function updateBlockEscapes(block,graph) {
    // block = [ startId, ..., endId] and sorted in order suitable to be traversed without further checks
    let endId = block[block.length-1];
    for (let i = block.length-2; i>=0; i--) {
      let nodeId = block[i];
      if ( graph[nodeId].fork != PARALLEL
           || graph[nodeId].successors.every(el => el != endId && graph[el].escapes.length)
      ) {
        for ( let j in graph[nodeId].successors ) {
          let successorId = graph[nodeId].successors[j];
          if ( successorId != endId ) {
            mergeUnique( graph[nodeId].escapes, graph[successorId].escapes )
          }
        }
      }
    }
  }

  function validateParallelBlock(block,graph,reporter) {
    // block = [ startId, ..., endId] and sorted in order suitable to be traversed without further checks
    let startId = block[0];
    let escapes = {};
    escapes[ block[0] ] = [];
    for (let i = 1; i < block.length; i++) {
      let nodeId = block[i];
      if ( graph[nodeId].predecessors.every(el => !block.includes(el) || escapes[el].length == 0) ) {
        if ( graph[nodeId].merge && graph[nodeId].merge != PARALLEL ) {
          if ( reporter ) {
            reporter.report(graph[nodeId].node.id,"Inconsistent merge, use parallel merge instead");
          }
          else {
            return false;
          }
        }
      }
      else {
        if ( graph[nodeId].merge && graph[nodeId].merge != INCLUSIVE ) {
          if ( reporter ) {
            if ( graph[nodeId].merge == PARALLEL ) {
              for ( let j in graph[nodeId].predecessors ) {
                let predecessorId = graph[nodeId].predecessors[j];
                for ( let k in escapes[predecessorId] ) {
                  reporter.report(graph[nodeId].node.id, "Required token may be lost at '" + escapes[predecessorId][k] + "'");
                  reporter.report(escapes[predecessorId][k], "May lose token required by  '" + graph[nodeId].node.id + "'");
                }
              }
            }
            else {
              reporter.report(graph[nodeId].node.id,"Inconsistent merge, use inclusive merge instead");
            }
          }
          else {
            return false;
          }
        }
      }

      escapes[nodeId] = [];
      for ( let j in graph[nodeId].predecessors ) {
        let predecessorId = graph[nodeId].predecessors[j];
        if ( graph[nodeId].merge == INCLUSIVE
           && escapes[predecessorId].length == 0
        ) {
          escapes[nodeId] = [];
          break;
        }

        mergeUnique( escapes[nodeId], escapes[predecessorId] );
      }
      mergeUnique( escapes[nodeId], graph[nodeId].escapes );
    }
    return true;
  }

  function removeStart(graph, reporter) {
    let REMOVAL = false;

    for (let id in graph) {
      if ( graph[id].predecessors.length == 0
           && graph[id].successors.length <= 1
      ) {
        removeSequentialNode( graph, id );
        REMOVAL = true;
      }
    }
    return REMOVAL;
  }

  function mergeUnique(array1,array2) {
    if ( !array1 ) {
      array1 = [];
    }
    for (let i in array2) {
      if ( !array1.includes(array2[i]) ) {
        array1.push(array2[i]);
      }
    }
  }
}

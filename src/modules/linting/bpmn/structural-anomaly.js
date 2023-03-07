const {
  is,
  isAny
} = require('bpmnlint-utils');

/************************************************/
/* A rule that detects unreachable nodes,       */
/* infinite loops, asymmetries and other        */
/* structural anomalies.                        */
/************************************************/
/*
A model is considered free of structural anomalies, if it is a combination of simple structures including:

- nodes with exactly one predecessor and one successor
- subsequent node pairs that form a symmetric gateway
- nodes that can only be reached by a path starting at themselves (simple loop)
- parallel forking gateways with a terminating path
- non-parallel forking gateways having only disjunct terminating paths
- subsequent non-parallel forking gateways each having a disjunct terminating path 
- node pairs that form a symmetric gateway and have at least one non-parallel forking gateways with a terminating path in between
- alternative start nodes for which the paths do not join or join at an exclusive gateway
- end nodes with a single predecessor
- start nodes with a single successor

The rule subsequently identifies such structures and removes them from the graph. Nodes that cannot be removed are considered to be forming a structural anomaly. Furthermore, the rule identifies:

- infinite loops
- repeated non-exclusive forking within a loop
- paths originating at a non-interrutping boundary event which are joined
- unreachable nodes
- pairs of gateways that are not symmetric 
- alternative starting nodes which join at a node which is not a exclusive gateway
- symmetric parallel gateways for which a required token may be lost
 
The rule ignores conditional flows and duplicate sequence flows. Subprocesses and activities are considered as exclusive gateway if they have one outgoing sequence flow and one or more interrupting boundary events, as parallel gateway if if they have multiple outgoing sequence flows and no interrupting boundary event, and as inclusive gateway if if they have multiple outgoing sequence flows and one or more interrupting boundary events.*/

module.exports = function () {

  // Gateway types
  const EXCLUSIVE = 1, PARALLEL = 2, INCLUSIVE = 3, COMPLEX = 4;
  let graph = {};
  let interruptingBoundaryEvents = [];
  let flowNodes = [];

  function check(node, reporter) {
    if ( is(node,'bpmn:FlowElementsContainer') ) {
      const flowElements = node.flowElements || [];
      flowNodes = flowElements.filter(function(flowElement) {
        return is(flowElement, 'bpmn:FlowNode')
      });

      // determine non-interrupting boundary events
      const nonInterruptingBoundaryEvents = flowElements.filter(function(flowElement) {
        return is(flowElement, 'bpmn:BoundaryEvent') && flowElement.cancelActivity === false;
      });
//console.log(nonInterruptingBoundaryEvents);
      let illegalJoins = {};
      for ( let i = 0; i < nonInterruptingBoundaryEvents.length; i++) {
        graph = buildAcyclicGraph( [ nonInterruptingBoundaryEvents[i] ], reporter );
        // flows of non-interrupting boundary events must be disjunct
        for (let id in graph) {
          if ( graph[id].node.id != id ) {
            // node had been cloned due to incoming flow from unknown node
            const node = graph[id].node;
            if ( graph[id].node.incoming.length > graph[node.id].predecessors.length + graph[id].predecessors.length ) {
              illegalJoins[node.id] = node.id;
            }
          }
        }
        validate( graph, reporter );
//console.log("BB Final",graph);
      }
      for (let id in illegalJoins) {
        reporter.report(id, 'Illegal join of flows');
      }

      // determine interrupting boundary events
      interruptingBoundaryEvents = flowElements.filter(function(flowElement) {
        return is(flowElement, 'bpmn:BoundaryEvent') && flowElement.cancelActivity !== false;
      });

//console.log(interruptingBoundaryEvents);

      // determine starting nodes
      const startingNodes = flowElements.filter(function(flowElement) {
        return is(flowElement, 'bpmn:FlowNode') 
               && (!flowElement.incoming || flowElement.incoming.length == 0) 
               && !is(flowElement, 'bpmn:BoundaryEvent');
      });
//console.log(startingNodes);
      graph = buildAcyclicGraph( startingNodes, reporter );
      validate( graph, reporter );
console.log("Final",graph);

      // report all unreachable nodes
      for (let i in flowNodes) {
        reporter.report(flowNodes[i].id, 'Node unreachable');
      }
    }
  }
  return {
    check
  };

/************************************************/
/** Validate                                   **/
/************************************************/

  function validate( graph, reporter ) {
    // check loops
    for (let id in graph) {
      if ( graph[id].node.id != id ) {
        const node = graph[id].node;
        let behaviour = getMergeBehaviour( node ); 
        if ( graph[id].predecessors.length == 0 ) {
          // remove fake loop without incoming flow from already reached nodes
          delete graph[node.id].cloned;
          delete graph[id];
        }
        else if ( behaviour && behaviour != EXCLUSIVE ) {
          reporter.report(node.id, 'Loop into non-exclusive gateway');
        }
      }
    }


    simplifyGraph( graph, reporter );

    const urlParams = new URLSearchParams(window.location.search);
    if ( urlParams.has('anomalies') ) {
      for (let id in graph) {
        if ( id == graph[id].node.id ) {
          reporter.report(id, 'Structural anomaly');
        }
      }
    }
  }

/************************************************/
/** Build acyclic graph                        **/
/************************************************/

  function buildAcyclicGraph( nodes, reporter ) {
    let graph = {};
    while ( nodes.length ) {
      let i = select(nodes, graph, reporter);
      insert( nodes, i, graph );
    }
    return graph;
  }

  function select(nodes, graph, reporter) {
    // select node that doesn't have any incoming arc from nodes outside the graph
    for (let i in nodes) {
      let selected = true;
      if ( nodes[i].incoming ) {
        for (j in nodes[i].incoming ) {
          if ( graph[ nodes[i].incoming[j].sourceRef.id ] == undefined) {
            selected = false;
            break;
          }
        }
      }
      if ( selected ) {
        return i;
      }
    }
    return;
  }

  function insert( nodes, i, graph) {
    graph[nodes[i || 0].id] = { node: nodes[i || 0], successors: [], predecessors: [] };
    if ( !i ) {
      // duplicate node
      graph[nodes[i || 0].id].cloned = true;
      graph[nodes[0].id + '_clone'] = { node: nodes[0], successors: [], predecessors: [] };
    }

    const node = nodes[i || 0];
    update(graph, node);
    nodes.splice(i || 0, 1);
    // remove node from set of unreached nodes
    flowNodes = flowNodes.filter( e => e.id != node.id);

    // add subsequent nodes
    if ( node.outgoing ) {
      for (let j in node.outgoing ) {
        let successor = node.outgoing[j].targetRef;
        if ( graph[successor.id] == undefined ) {
          nodes.push(successor);
        }
      }
    }

    // add all boundary event nodes
    const boundaryEvents = interruptingBoundaryEvents.filter( e => e.attachedToRef.id == node.id);
    for (let j in boundaryEvents ) {
      let successor = boundaryEvents[j];
      nodes.push(successor);
    }
  }

  function update(graph, node) {
    // update predecessors and successors after insertion
    if ( node.incoming && node.incoming.length ) {
      for ( i in node.incoming) {
        let predecessorId = node.incoming[i].sourceRef.id;
        if ( graph[predecessorId] ) {
          if ( graph[node.id].predecessors.indexOf(predecessorId) == -1 ) {
            graph[node.id].predecessors.push(predecessorId);
          }
          if ( graph[predecessorId].successors.indexOf(node.id) == -1 ) {
            graph[predecessorId].successors.push(node.id);
          }
        }
      }
    }
    else if ( is(node,'bpmn:BoundaryEvent') && node.cancelActivity !== false ) {
      let predecessorId = node.attachedToRef.id;
      graph[node.id].predecessors.push(predecessorId);
      graph[predecessorId].successors.push(node.id);
    }

    if ( node.outgoing && node.outgoing.length ) {
      for ( i in node.outgoing) {
        let successorId = node.outgoing[i].targetRef.id + "_clone";
        if ( graph[successorId] ) {
          if ( graph[node.id].successors.indexOf(successorId) == -1 ) {
            graph[node.id].successors.push(successorId);
          }
          if ( graph[successorId].predecessors.indexOf(node.id) == -1 ) {
            graph[successorId].predecessors.push(node.id);
          }
        }
      }
    }
  }

/************************************************/
/** Simplify graph                             **/
/************************************************/
  function simplifyGraph( graph, reporter ) {
    while ( removeIntermediateNodes(graph, reporter)
            || removeSymmetricGateways(graph, reporter)
            || removeEscapableSymmetricGateways(graph, reporter)
            || removeSimpleLoop(graph, reporter)
            || removeMultipleStarts(graph, reporter)
            || removeAlternativeEnds(graph, reporter)
            || removeSubsequentAlternativeEnd(graph, reporter)
            || removeParallelEnd(graph, reporter)
            || removeEnd(graph, reporter)
            || removeStart(graph, reporter)
    ) {
      console.log("Graph",graph);
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

  function getForkBehaviour( node ) {
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
              && interruptingBoundaryEvents.filter( e => e.attachedToRef.id == node.id ).length > 0 
    ) {
      if ( node.outgoing && node.outgoing.length > 1 ) return fork = INCLUSIVE;
      if ( node.outgoing && node.outgoing.length == 1 ) return fork = EXCLUSIVE;
    }
    else {
      // all other nodes with multiple outgoing arcs behave like parallel gateways
      if ( node.outgoing && node.outgoing.length > 1 ) return fork = PARALLEL;
    }
 
    return fork;
  } 

  function removeNode( graph, id ) {
console.log("REMOVE",id,graph[id]);
    let predecessorId = graph[id].predecessors.length == 1 ? graph[id].predecessors[0] : undefined;
    let successorId = graph[id].successors.length == 1 ? graph[id].successors[0] : undefined;
    if ( predecessorId  && graph[predecessorId] ) {
      graph[predecessorId].successors = graph[predecessorId].successors.filter(e => e !== id);
      if ( successorId ) {
        graph[predecessorId].successors.push(successorId);
      }
    }

    if ( successorId && graph[successorId] ) {
      if ( predecessorId  ) {
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
//console.log("removeIntermediateNodes");
    let REMOVAL = false;
    for (let id in graph) {
      if ( graph[id].predecessors.length == 1 
           && graph[id].successors.length == 1
           && !graph[id].cloned 
      ) {
console.log("removeIntermediateNodes",id);
        removeNode( graph, id );
        REMOVAL = true;
      }
    }
    return REMOVAL;
  }

  function removePair( graph, predecessorId, successorId ) {
    graph[predecessorId].successors = graph[predecessorId].successors.filter(e => e != successorId);
    graph[successorId].predecessors = graph[successorId].predecessors.filter(e => e != predecessorId);
    graph[predecessorId].successors.push(successorId);
    graph[successorId].predecessors.push(predecessorId);

console.log("removePair",predecessorId, successorId);
    if ( graph[predecessorId].predecessors.length <= 1 
         && graph[predecessorId].successors.length <= 1 
         && !graph[predecessorId].cloned 
    ) {
      removeNode( graph, predecessorId); 
    }
    if ( graph[successorId].predecessors.length <= 1 
         && graph[successorId].successors.length <= 1
         && !graph[successorId].cloned 
         && graph[successorId].node.id == successorId 
    ) {
      removeNode( graph, successorId); 
    }
  }

  function removeSymmetricGateways(graph, reporter) {
//console.log("removeSymmetricGateways");
    let REMOVAL = false;
    for (let id in graph) {
      const nodeId = graph[id].node.id;
      const inflows = graph[id].predecessors.length;
      if ( inflows > 1 ) {
        const predecessorId = graph[id].predecessors[0];
        const outflows = graph[predecessorId].successors.length;
        if ( graph[predecessorId].successors.filter(e => e == id).length > 1 ) {
          if ( inflows != outflows ) {
            reporter.report(nodeId, "Inflows do not match with '" + predecessorId + "'");
            reporter.report(predecessorId, "Outflows do not match with '" + nodeId + "'");
          }

          if ( getForkBehaviour(graph[predecessorId].node) != getMergeBehaviour(graph[id].node) ) {
//console.log(getForkBehaviour(graph[predecessorId].node) , getMergeBehaviour(graph[id].node));
            reporter.report(nodeId, "Not symmetric with '" + predecessorId + "'");
            reporter.report(predecessorId, "Not symmetric with '" + nodeId + "'");
          }

          // remove
          removePair( graph, predecessorId, id )
          REMOVAL = true;
        }
      }
    }
    return REMOVAL;
  }

  function removeEscapableSymmetricGateways(graph, reporter) {
//console.log("removeEscapableSymmetricGateways");
    let REMOVAL = false;
    for (let id in graph) {
      const inflows = graph[id].predecessors.length;
      if ( inflows > 1 ) {
//console.log("removeEscapableSymmetricGateways",id);
        let escapableForks = {};
        for (var i = 0; i < graph[id].predecessors.length; i++) {
          let predecessorId = graph[id].predecessors[i]
          let optionalExit = isOptionalExit(graph, predecessorId);
//console.log("optionalExit",predecessorId,optionalExit);
          if ( optionalExit 
               && graph[predecessorId].predecessors.length == 1 
          )  {
            let candidateId = graph[predecessorId].predecessors[0];
//console.log("Escapable forks",escapableForks,candidateId);
            if ( getForkBehaviour( graph[candidateId].node ) ) {
              if ( escapableForks[candidateId] == undefined ) {
                escapableForks[candidateId] = { id: candidateId, optionalExits: [ optionalExit ] };
//console.log("Create",escapableForks[candidateId].optionalExits);
              }
              else {
                escapableForks[candidateId].optionalExits.push(optionalExit);
//console.log("Push",escapableForks[candidateId].optionalExits);
              }
            }  
          }
        }
        const nodeId = graph[id].node.id;
//console.log("Escapable forks",escapableForks,id);
        for ( var i in escapableForks ) {
          const fork = escapableForks[i];
//console.log("Fork",fork);
          if ( fork.optionalExits.length + graph[fork.id].successors.filter(e => e == id).length > 1 ) {
            const outflows = graph[fork.id].successors.length;
  
            if ( inflows != outflows ) {
              reporter.report(nodeId, "Inflows do not match with '" + fork.id + "'");
              reporter.report(fork.id, "Outflows do not match with '" + nodeId + "'");
            }

            const forkBehaviour = getForkBehaviour(graph[fork.id].node);
            const mergeBehaviour = getMergeBehaviour(graph[id].node);

            if ( forkBehaviour != mergeBehaviour ) {
              reporter.report(nodeId, "Not symmetric with '" + fork.id + "'");
              reporter.report(fork.id, "Not symmetric with '" + nodeId + "'");
            }

console.log("removeEscapableSymmetricGateways",fork.id, id);
            // remove all but one optional exits
            for ( var j=0; j< fork.optionalExits.length; j++ ) {
              if ( mergeBehaviour == PARALLEL ) {
                reporter.report(nodeId, "Required token may be lost at '" + fork.optionalExits[j].id + "'");
                reporter.report(fork.optionalExits[j].id, "Token required by '" + nodeId + "' may be lost");
              }
              if ( j > 0 ) {
                removeNode( graph, fork.optionalExits[j].endId );
                removeNode( graph, fork.optionalExits[j].id );
                REMOVAL = true;
              }
            }
            // remove all direct links
            graph[id].predecessors = [ graph[id].predecessors.find(e => e != fork.id) ];
            graph[fork.id].successors = [ graph[fork.id].successors.find(e => e != id) ];
            REMOVAL = true;
          }
        }
      }
    }
    return REMOVAL;
  }

  function removeMultipleStarts(graph, reporter) {
    let REMOVAL = false;
    for (let id in graph) {
      const behaviour = getMergeBehaviour( graph[id].node );
      if ( behaviour ) {
        let alternativeStarts = graph[id].predecessors.filter(function(predecessorId) {
          return ( !graph[predecessorId].cloned
               && graph[predecessorId].predecessors.length == 0
               && !getForkBehaviour( graph[predecessorId].node) );
        });
        if ( alternativeStarts.length > 1 ) {
          if ( behaviour != EXCLUSIVE && alternativeStarts.length == 2 ) {
            reporter.report(id, 'Alternative flows into non-exclusive gateway');
          } 
          // remove alternative start
          for (var i = 1; i < alternativeStarts.length; i++) {
console.log("removeAlternativeStart",alternativeStarts[i]);
            removeNode( graph, alternativeStarts[i] );
            REMOVAL = true;
          }
        }
      }
    }
    return REMOVAL;
  }

  function removeAlternativeEnds(graph, reporter) {
    let REMOVAL = false;
    for (let id in graph) {
      const behaviour = getForkBehaviour( graph[id].node );
      if ( behaviour && behaviour != PARALLEL ) {
        let alternativeEnds = graph[id].successors.filter(function(successorId) {
          return ( !graph[successorId].cloned
               && graph[successorId].successors.length == 0
               && !getMergeBehaviour( graph[successorId].node) );
        });
        if ( alternativeEnds.length > 1 ) {
          // remove alternative end
          for (var i = 1; i < alternativeEnds.length; i++) {
console.log("removeAlternativeEnd",alternativeEnds[i]);
            removeNode( graph, alternativeEnds[i] );
            REMOVAL = true;
          }
        }
      }
    }
    return REMOVAL;
  }

  function isOptionalExit(graph,id) {
    const behaviour = getForkBehaviour( graph[id].node );
    if ( behaviour && behaviour != PARALLEL 
         && graph[id].successors.length >= 2
    ) {
      const successorId = graph[id].successors.find(successorId => graph[successorId].successors.length > 0);
      const endId = graph[id].successors.find(successorId => graph[successorId].successors.length == 0 && graph[successorId].node.id == successorId);
      if ( successorId && endId ) {
//console.log("isOptionalExit",id, successorId, endId);
        return { id, successorId, endId };
      } 
    }
  }

  function removeSubsequentAlternativeEnd(graph, reporter) {
    let REMOVAL = false;
    for (let id in graph) {
      if ( graph[id].successors.length == 2 ) {
        let optionalExit = isOptionalExit(graph, id );
//console.log("optionalExit",optionalExit);
        if ( optionalExit 
             && isOptionalExit(graph,optionalExit.successorId)
             && graph[ optionalExit.endId ].predecessors.length == 1 
        ) {
console.log("removeSubsequentAlternativeEnd",optionalExit.endId);
          removeNode( graph, optionalExit.endId );
          REMOVAL = true;
        }
      }
    }
    return REMOVAL;
  }

  function removeParallelEnd(graph, reporter) {
//console.log("removeParallelEnd");
    let REMOVAL = false;
    for (let id in graph) {
      if ( graph[id].successors.length == 0 
           && graph[id].predecessors.length == 1 
           && graph[id].node.id == id
      ) {
        const predecessorId = graph[id].predecessors[0];
        if ( getForkBehaviour( graph[predecessorId].node ) == PARALLEL ) {
console.log("removeParallelEnd",id);
          removeNode( graph, id );
          if ( graph[predecessorId].predecessors.length <= 1 
               && graph[predecessorId].successors.length <= 1
          ) {
            removeNode( graph, predecessorId );
          }
          REMOVAL = true;
        }
      }
    }
    return REMOVAL;
  }

  function removeSimpleLoop(graph, reporter) {
//console.log("removeLoop");
    let REMOVAL = false;
    for (let id in graph) {
      if ( id != graph[id].node.id ) {
//console.log("removeSimpleLoop",id);
        let nodeId = id;
        let escapable = false;
        let nonExclusive = [];
        while ( nodeId != graph[id].node.id && graph[nodeId].predecessors.length == 1 ) {
          nodeId = graph[nodeId].predecessors[0];
          if ( nodeId != graph[id].node.id && graph[nodeId].cloned ) {
            // inner loop has to be removed first
            break;
          }
//console.log("nodeId",nodeId,graph[id].node.id,id);
          const behaviour = getForkBehaviour(graph[nodeId].node);
          if ( behaviour && behaviour != PARALLEL ) {
            escapable = true;
          }
          if ( behaviour && behaviour != EXCLUSIVE ) {
            nonExclusive.push(nodeId);
          }
        }
        if ( nodeId == graph[id].node.id ) {
console.log("removeSimpleLoop",nodeId);
          if ( !escapable ) {
            reporter.report(nodeId, 'Infinite loop');
          }
          for (let i in nonExclusive) {
            reporter.report(nonExclusive[i], 'Repeated forking');
          }
          delete graph[nodeId].cloned;
          removeNode( graph, id ); // remove clone
          REMOVAL = true;
        }
      }
    }
    return REMOVAL;
  }

  function removeEnd(graph, reporter) {
    let REMOVAL = false;
    for (let id in graph) {
      if ( graph[id].predecessors.length <= 1 
           && graph[id].successors.length == 0
           && graph[id].node.id == id // do not remove clone created for loop
      ) {
console.log("removeEnd",id);
        removeNode( graph, id );
        REMOVAL = true;
        break;
      }
    }
    return REMOVAL;
  }

  function removeStart(graph, reporter) {
    let REMOVAL = false;
    for (let id in graph) {
      if ( graph[id].predecessors.length == 0 
           && graph[id].successors.length <= 1
           && !graph[id].cloned
      ) {
console.log("removeStart");
        removeNode( graph, id );
        REMOVAL = true;
        break;
      }
    }
    return REMOVAL;
  }

}


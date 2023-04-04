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
The rule uses reduction rules to iteratively simplify the model and detect anomalies.

In a first step, unreachable nodes are detected. In a second step it is checked whether the flow going out of non-interrupting gateways merges with other flows. Then, the flow emerging at start nodes and the flows emerging from non-interrupting gateways are checked independently.

A directed acyclic graph is created by conducting a topological sort. To eliminate cycles, the topological sort creates a copy of a node that forms the entry point into a loop and the inflows from all later nodes are redirected to the copy. After adding an empty set of `escapes` as well as the fork or merge behaviour (EXCLUSIVE, PARALLEL, INCLUSIVE, COMPLEX) for every applicable node, the following reduction rules are applied to the model to subsequently identify potential deadlocks, livelocks, races, and asymmetric gateways:

- Intermediate nodes: nodes which are not the entry point of a loop and which have exactly on predecessor and one successor are removed if the predecessor is not a fork or if the node has an empty list of escapes.
- Parallel ends: end nodes which are not the copy of an entry point to a loop and which have single predecessor which is a parallel gateway are removed
- Alternative ends: end nodes which are not the copy of an entry point to a loop and which have single predecessor which is a non-parallel gateway are removed after adding the id of the non-parallel gateway to the set of escapes of the gateway. If the gateway is no longer forking, the fork behaviour is unset.
- Multiple flows between gateways: if there are multiple flows between a forking and a merging gateway, all but one of these flows are removed and the fork and merge behaviour is unset if applicable. If the original fork and merge behaviour didn't match, an error is reported as this can be regarded as bad modelling style and in case of a parallel merge can lead to a deadlock. 
- Blocks between a forking and a merging gateway without any loop node and without any other inflow or outflow between initial fork and final merge, except of potential escapes, are replaced by a direct link. Within the block all escapes are propagated towards the inflows of the direct predecessors of the merging gateway. If the merging gateway is a parallel merge and any of the predecessors has a non-empty set of escapes, a potential deadlock is reported. Furthermore, the escapes of these predecessors are added to the escapes of the forking gateway. Within a block all gateways must be consistent. If no consistent block exists, also blocks with inconsistent gateways are replaced by a direct link and the inconsistencies are reported.
- Loops: Nodes along any path in the directed acyclic graph from an entry point of a loop to its copy are merged, all inflows and outflows are redirected accordingly and all escapes are combined. Only loops that do not contain the entry point of another loop or any other of the aformentioned blocks are considered. Loops may only contain exclusive forks and merges. If no such loop and none of  the aformentioned blocks exists loops with different for or merge behaviour are also merged, however, an anomaly is reported because of potential deadlocks and races.  If the merged node doesn't have an escape or outflow, the loop is infinite and a respective anomaly is reported. 

The above blocks are repeatedly identified in the order given above until no further block can be reduced.
Thereafter, end and start nodes are removed and all remaining nodes are reported as anomaly. 
*/

module.exports = function () {

  // Gateway types
  const EXCLUSIVE = 1, PARALLEL = 2, INCLUSIVE = 3, COMPLEX = 4;
  let graph = {};

  function check(node, reporter) {
    if ( is(node,'bpmn:FlowElementsContainer') ) {
      const flowElements = node.flowElements || [];
      const flowNodes = flowElements.filter(function(flowElement) {
        return is(flowElement, 'bpmn:FlowNode') 
               && (!is(flowElement, 'bpmn:SubProcess') || !flowElement.triggeredByEvent) 
               && !flowElement.isForCompensation
      });


      // determine starting nodes
      const startingNodes = flowElements.filter(function(flowElement) {
        return is(flowElement, 'bpmn:FlowNode') 
               && (!flowElement.incoming || flowElement.incoming.length == 0) 
               && (!is(flowElement, 'bpmn:SubProcess') || !flowElement.triggeredByEvent)
               && !flowElement.isForCompensation
               && !is(flowElement, 'bpmn:BoundaryEvent');
      });

      // determine all boundary events (including unreachable)
      const allBoundaryEvents = flowElements.filter(e => is(e, 'bpmn:BoundaryEvent'));

      // determine reachable and unreachable nodes
      const reachableNodes = reachable(startingNodes,allBoundaryEvents);
      const unreachableNodes = flowNodes.filter(e => !reachableNodes.includes(e));

      // report all unreachable nodes
      for (let i in unreachableNodes.filter(e => !is(e, 'bpmn:BoundaryEvent')) ) {
        reporter.report(unreachableNodes[i].id, 'Node unreachable');
      }

      // report merges of flows from unreachable nodes
      for (let i in reachableNodes ) {
        const node = reachableNodes[i];
        if ( node.incoming) {
          for ( let j in node.incoming) {
            let predecessorId = node.incoming[j].sourceRef.id;
            if ( unreachableNodes.find(e => e.id == predecessorId) ) {
              reporter.report(node.id, "Merge with flow from unreachable node '" + predecessorId + "'" );
            }
          }
        }
      }

      // determine reachable interrupting non-interrupting boundary events
      const interruptingBoundaryEvents = allBoundaryEvents.filter(e => is(e,'bpmn:BoundaryEvent') && e.cancelActivity !== false);
      const nonInterruptingBoundaryEvents = allBoundaryEvents.filter(e => is(e,'bpmn:BoundaryEvent') && e.cancelActivity === false);

      // determine nodes that can be reached from start without passing through non-interrupting boundary events
      const regularNodes = reachable(startingNodes,interruptingBoundaryEvents);
/*
console.log("startingNodes",[...startingNodes]);
console.log("reachableNodes",[...reachableNodes]);
console.log("regularNodes",[...regularNodes]);
console.log("unreachableNodes",[...unreachableNodes);
console.log("interruptingBoundaryEvents",[...interruptingBoundaryEvents]);
console.log("nonInterruptingBoundaryEvents",[...nonInterruptingBoundaryEvents]);
*/


      graph = buildAcyclicGraph( startingNodes, interruptingBoundaryEvents, regularNodes, reporter );
//console.log("Initial",structuredClone(graph));
      validate( graph, reporter );
//console.log("Final",structuredClone(graph));

      // Check submodels starting at non-interrupting boundary events
      const reachableFromBoundary = [];
      for ( let i in nonInterruptingBoundaryEvents ) {
        reachableFromBoundary.push(reachable([ nonInterruptingBoundaryEvents[i] ],allBoundaryEvents));
      }
      for ( let i in reachableFromBoundary ) {
          var intersection = reachableFromBoundary[i].filter(a => regularNodes.some(b => a.id == b.id));  
        if ( intersection.length ) {
          reporter.report(nonInterruptingBoundaryEvents[i].id, 'Outgoing flow merges with regular flow');
        }
        for ( let j in reachableFromBoundary ) {
          if ( i != j ) {
            intersection = reachableFromBoundary[i].filter(a => reachableFromBoundary[j].some(b => a.id == b.id));
            if ( intersection.length ) {
              reporter.report(nonInterruptingBoundaryEvents[i].id, "Outgoing flow merges with flow from '" + nonInterruptingBoundaryEvents[j].id + "'");
            }          }
        }
      }

      for ( let i in nonInterruptingBoundaryEvents ) {
        graph = buildAcyclicGraph( [ nonInterruptingBoundaryEvents[i] ], interruptingBoundaryEvents, reachableFromBoundary[i], reporter );
        validate( graph, reporter );
      }
/*
*/

    }
  }
  return {
    check
  };

/************************************************/
/** Determine reachable nodes                  **/
/************************************************/
  function reachable(startEvents, boundaryEvents) {
//console.log("reachable",startEvents)
    const reachableNodes = [];
    var visited = [...startEvents];
    while ( visited.length ) {
      const node = visited.shift();
      if ( !reachableNodes.includes( node ) ) {
        reachableNodes.push(node);
        visited = visited.concat(getSuccessors(node,boundaryEvents));
      } 
    }
    return reachableNodes;
  }

  function getSuccessors(node, boundaryEvents) {
    const successors = [];
    if ( node.outgoing ) {
      for (j in node.outgoing ) {
        successors.push( node.outgoing[j].targetRef );
      }
    }
    // add all boundary event nodes
    const attachedBoundaryEvents = boundaryEvents.filter( e => e.attachedToRef.id == node.id);
    for (let j in attachedBoundaryEvents ) {
      let successor = attachedBoundaryEvents[j];
////console.log("Add",successor);
      successors.push(successor);
    }
//console.log(node,"successors",successors);
    return successors;
  }

/************************************************/
/** Validate                                   **/
/************************************************/

  function validate( graph, reporter ) {
    simplifyGraph( graph, reporter );

    for (let id in graph) {
      if ( id == graph[id].node.id ) {
        reporter.report(id, 'Structural anomaly');
      }
    }
/*
    const urlParams = new URLSearchParams(window.location.search);
    if ( urlParams.has('anomalies') ) {
      for (let id in graph) {
        if ( id == graph[id].node.id ) {
          reporter.report(id, 'Structural anomaly');
        }
      }
    }
*/
  }

/************************************************/
/** Build acyclic graph                        **/
/************************************************/

  function buildAcyclicGraph( nodes, interruptingBoundaryEvents, reachables, reporter ) {
    let graph = {};
    while ( nodes.length ) {
//console.log("Nodes",nodes);
      let i = select(nodes, reachables, graph, reporter);
      if ( i != undefined ) {
        insert( nodes, i, interruptingBoundaryEvents, graph );
      }
      else {
        i = selectLoopNode(nodes, graph, interruptingBoundaryEvents, reporter);
        if ( i == undefined ) {
console.error("No loop found");
        }
        const id = nodes[i].id;
        insert( nodes, i, interruptingBoundaryEvents, graph );
        if ( graph[id].merge != EXCLUSIVE ) {
          reporter.report(id, 'Loop into non-exclusive gateway');
        }
        // duplicate node
        graph[id].cloned = true;
        graph[id + '_clone'] = { 
          node: graph[id].node, 
          successors: [], 
          predecessors: [], 
          merge: getMergeBehaviour(graph[id].node,interruptingBoundaryEvents), 
          fork: undefined, //getForkBehaviour(graph[id].node,interruptingBoundaryEvents), 
          escapes: []
        };
      }
    }

    return graph;
  }


  function select(nodes, reachables, graph, reporter) {
    // select node that doesn't have any incoming arc from nodes yet to be included
    for (let i in nodes) {
      let selected = true;
      if ( nodes[i].incoming ) {
        for (j in nodes[i].incoming ) {
          const incomingId = nodes[i].incoming[j].sourceRef.id;
          if ( incomingId != nodes[i].id 
               && reachables.find(e => e.id == incomingId) 
               && graph[ incomingId ] == undefined
          ) {
            selected = false;
            break;
          }
        }
      }
      if ( is(nodes[i],'bpmn:BoundaryEvent') 
           && nodes[i].cancelActivity !== false 
           && graph[ nodes[i].attachedToRef.id ]  == undefined 
      ) {
        // do not select interrupting boundary if respective activity is not yet included 
        selected = false;
      }
      if ( selected ) {
        return i;
      }
    }
    return;
  }

  function selectLoopNode(nodes, graph, boundaryEvents, reporter) {
//console.log("selectLoopNode");
    // find node that has a path to itself
    for (let i in nodes) {
      const id = nodes[i].id;
//console.log("selectLoopNode",id);
      const stack = [];
      mergeUnique(stack,getSuccessors(nodes[i],boundaryEvents));
      while ( stack.length ) {
        const node = stack.shift();
        if ( node.id == id ) {
//console.log("Cycle:",id);
          return i;
        }
        const successors = getSuccessors(node,boundaryEvents);
        mergeUnique(stack,successors.filter(e => graph[e.id] == undefined)); 
      }
    }
  }

  function insert( nodes, i, interruptingBoundaryEvents, graph) {
    const node = nodes[i];
//console.log("Insert",i,node,graph);
    graph[node.id] = { 
      node, 
      successors: [], 
      predecessors: [], 
      merge: getMergeBehaviour(node,interruptingBoundaryEvents), 
      fork: getForkBehaviour(node,interruptingBoundaryEvents), 
      escapes: []
    };

    update(graph, node);
    nodes.splice(i, 1);

    // add subsequent nodes
    if ( node.outgoing ) {
      for (let j in node.outgoing ) {
        let successor = node.outgoing[j].targetRef;
        if ( graph[successor.id] == undefined && !nodes.includes(successor) ) {
//console.log("Add",successor);
          nodes.push(successor);
        }
      }
    }

    // add all boundary event nodes
    const boundaryEvents = interruptingBoundaryEvents.filter( e => e.attachedToRef.id == node.id);
//console.log("boundaryEvents",interruptingBoundaryEvents,boundaryEvents);
    for (let j in boundaryEvents ) {
      let successor = boundaryEvents[j];
////console.log("Add",successor);
      nodes.push(successor);
    }
  }

  function update(graph, node) {
    // update predecessors and successors after insertion
    if ( node.incoming && node.incoming.length ) {
      for ( let i in node.incoming) {
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
      for ( let i in node.outgoing) {
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

  function getMergeBehaviour( node, interruptingBoundaryEvents ) {
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

  function getForkBehaviour( node, interruptingBoundaryEvents ) {
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

  function canLoop(id,graph) {
    return graph[id].cloned || graph[id].node.id != id;
  }

/************************************************/
/** Simplify graph                             **/
/************************************************/
  function simplifyGraph( graph, reporter ) {
    while ( removeIntermediateNodes(graph, reporter)
            || removeParallelEnd(graph, reporter)
            || removeAlternativeEnds(graph, reporter)
            || removeMultipleFlowsBetweenGateways(graph, reporter)
            || removeAcyclicConnectedBlock(graph, reporter)
            || removeAcyclicConnectedBlock(graph, reporter, true)   
            || removeLoop(graph, reporter)
            || removeLoop(graph, reporter, true)
    ) {
//console.log("Graph",structuredClone(graph));
    }
    removeEnd(graph, reporter)
    removeStart(graph, reporter)
  }

  function removeSequentialNode( graph, id ) {
//console.log("REMOVE",id,graph[id]);
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
           && !canLoop( id,graph )
      ) {
        if ( !graph[id].escapes.length  ) {
//console.log("removeIntermediateNodes",id);
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

  function removeParallelEnd(graph, reporter) {
//console.log("removeParallelEnd");
    let REMOVAL = false;
    for (let id in graph) {
      if ( graph[id].successors.length == 0 
           && graph[id].predecessors.length == 1 
           && graph[id].node.id == id // exclude clone created for loop 
      ) {
        const predecessorId = graph[id].predecessors[0];
        if ( graph[predecessorId].fork == PARALLEL ) {
//console.log("removeParallelEnd",id);
          removeSequentialNode( graph, id );
          if ( graph[predecessorId].predecessors.length <= 1 
               && graph[predecessorId].successors.length <= 1
          ) {
            removeSequentialNode( graph, predecessorId );
          }
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
          return ( !canLoop(successorId,graph)
                   && graph[successorId].successors.length == 0
                   && !graph[successorId].merge );
        });
////console.log("removeAlternativeEnd",id,alternativeEnds);
        // remove all alternative ends
        for (var i = 0; i < alternativeEnds.length; i++) {
//console.log("removeAlternativeEnd",alternativeEnds[i]);
          removeSequentialNode( graph, alternativeEnds[i] );
          REMOVAL = true;
        }
        if ( alternativeEnds.length > 0 ) {
          graph[id].escapes.push(id);
          if ( graph[id].successors.length <= 1 ) {
            graph[id].fork = undefined;
          }
//console.log("Graph",structuredClone(graph));
        }
      }
    }
    return REMOVAL;
  }

  function removeMultipleFlowsBetweenGateways(graph, reporter) {
//console.log("removeMultipleFlowsBetweenGateways");
    let REMOVAL = false;
    for (let id in graph) {
      const nodeId = graph[id].node.id;
      const inflows = graph[id].predecessors.length;
      if ( graph[id].merge ) {
        const merging = graph[id].predecessors.filter((e, i, a) => a.indexOf(e) !== i);
        for ( let i in merging ) {
          const predecessorId = merging[i];
          if ( graph[id].predecessors.filter(e => e == predecessorId).length > 1 ) {
//console.log("removeMultipleFlowsBetweenGateways",predecessorId,id);

            if ( graph[predecessorId].fork != graph[id].merge ) {
////console.log(getForkBehaviour(graph[predecessorId].node) , getMergeBehaviour(graph[id].node));
              reporter.report(nodeId, "Not symmetric with '" + predecessorId + "'");
              reporter.report(predecessorId, "Not symmetric with '" + nodeId + "'");
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

  function removeLoop(graph, reporter, force) {
    let REMOVAL = false;
    for (let id in graph) {
      if ( id != graph[id].node.id ) {
//console.log("removeLoop",id);
        let nodeId = graph[id].node.id;
////console.log("removeSimpleLoop",id,graph[id].predecessors,nodeId);
        const cycleNodes = findAllCycles(nodeId, graph, reporter, force);
        if ( cycleNodes ) {
//console.log("Cycle nodes:", cycleNodes);
          for ( let i=1; i < cycleNodes.length; i++ ) {
            mergeUnique( graph[nodeId].escapes, graph[cycleNodes[i]].escapes);
            redirectPredecessors(cycleNodes[i], nodeId);
            redirectSuccessors(cycleNodes[i], nodeId);
            // remove currentId from graph
            delete graph[cycleNodes[i]]; 
            REMOVAL = true;
          }
          graph[nodeId].predecessors = graph[nodeId].predecessors.filter(e => e != nodeId);
          graph[nodeId].successors = graph[nodeId].successors.filter(e => e != nodeId);
          delete graph[nodeId].cloned;
//console.log("Cycle removed",structuredClone(graph));
          if ( !graph[nodeId].escapes.length )
          if ( !graph[nodeId].escapes.length && !graph[nodeId].successors.length ) {
            reporter.report(nodeId, 'Infinite loop');
          }    
        }
      }
    }
    return REMOVAL;
  }

  function redirectPredecessors(fromId, toId) {
//console.log("Redirect predecessors",predecessors,"of", fromId, "to", toId,); 
    for ( let j in graph[fromId].predecessors ) {
      const predecessorId = graph[fromId].predecessors[j];
      if ( graph[predecessorId].successors.includes(toId) ) {
        graph[predecessorId].successors = graph[predecessorId].successors.filter(e => e != fromId);
      }
      else {
        let index = graph[predecessorId].successors.indexOf(fromId);
        graph[predecessorId].successors[index] = toId;
        graph[toId].predecessors.push(predecessorId);
      }
    }
  }

  function redirectSuccessors(fromId, toId) {
//console.log("Redirect successors",successors,"of", fromId, "to", toId,); 
    for ( let j in graph[fromId].successors ) {
      const successorId = graph[fromId].successors[j];
      if ( graph[successorId].predecessors.includes(toId) ) {
        graph[successorId].predecessors = graph[successorId].predecessors.filter(e => e != fromId);
      }
      else {
        let index = graph[successorId].predecessors.indexOf(fromId);
        graph[successorId].predecessors[index] = toId;
        graph[toId].successors.push(successorId);
      }
    }
  }

  function findAllCycles(id, graph, reporter, force) {
//console.log("findAllCycles",id);
    var cycleNodes = [];
    const stack = [ [ id ] ];
    while ( stack.length ) {
//console.log("stack:",stack);
      const path = stack.shift();
      const nodeId = path.at(-1);
//console.log("Path:",path,nodeId);
      if ( nodeId == id + '_clone' ) {
//console.log("Cycle:",path);
        mergeUnique(cycleNodes, path);
      }
      else if ( graph[nodeId].node.id == nodeId ) {
        for ( let i in graph[nodeId].successors ) {
          const successorId = graph[nodeId].successors[i];
          stack.push( path.concat(successorId) );
        }
      }
    }
//console.log("Cycle nodes",cycleNodes);

    if ( !cycleNodes.length ) {
//console.log("Cycle not found!",id);
      return;
    }
    for ( let i = 0; i < cycleNodes.length; i++ ) {
      if ( graph[cycleNodes[i]].node.id != id ) {
        if  ( graph[cycleNodes[i]].cloned ) {
          // cycle passes through another loop
//console.log("Cycle passes through another loop!",id,cycleNodes[i]);
          return;
        }

        if ( force ) {
          if ( graph[cycleNodes[i]].fork && graph[cycleNodes[i]].fork != EXCLUSIVE ) {
            reporter.report(cycleNodes[i],"Loop may release multiple tokens");
          }
          if ( graph[cycleNodes[i]].merge && graph[cycleNodes[i]].merge != EXCLUSIVE ) {
            reporter.report(cycleNodes[i],"Non-exclusive merge in loop");
          }
        }
        else if ( (graph[cycleNodes[i]].fork && graph[cycleNodes[i]].fork != EXCLUSIVE )
              || (graph[cycleNodes[i]].merge && graph[cycleNodes[i]].merge != EXCLUSIVE ) 
        ) {
          // cycle passes through non-exclusive gateway
//console.log("Cycle passes through non-exclusive gateway!",id);
          return;
        }
      }
    }
    return cycleNodes;
  }


  function removeAcyclicConnectedBlock(graph, reporter, force) {
    let REMOVAL = false;
    for (let startId in graph) {
      if ( graph[startId].fork ) {
        for (let endId in graph) {
          if ( graph[endId].merge &&
               ( force 
                 || graph[endId].merge == graph[startId].fork
                 || ( graph[startId].fork == PARALLEL && graph[endId].merge == INCLUSIVE )
               ) 
          ) {
            let block = findAcyclicConnectedBlock(startId, endId, graph, force);
            if ( block ) {
              // detect non-matching gateways
              let reports = []
              for ( let id in block ) {
                if ( graph[id].fork && graph[id].fork != graph[startId].fork ) {
                  reports.push({ id, message: "Fork inconsistent with fork at '" + startId + "'" });
                  reports.push({ id: startId, message: "Fork inconsistent with fork at '" + id + "'" });
                } 
                if ( id != startId 
                     && graph[id].merge 
                     && graph[id].merge != graph[startId].fork
                     && graph[id].merge != requiredMerge(id,graph,block,graph[startId].fork)
                ) {
                  reports.push({ id, message: "Merge inconsistent with fork at '" + startId + "'" });
                  reports.push({ id: startId, message: "Fork inconsistent with merge at '" + id + "'" });
                } 
              }        
/*
              if ( reports.length > 0 ) {
                reports.push({ id: endId, message: "Inconsistent gateway(s) starting with '" + startId + "'" });
                reports.push({ id: startId, message: "Inconsistent gateway(s) ending with '" + endId + "'" });
              }
*/
              for ( let id in block ) {
                if ( id != startId 
                     && graph[startId].fork == PARALLEL
                     && graph[id].merge == PARALLEL
                ) {
                  for ( let i in block[id].escapes ) {
                    reports.push({ id, message: "Required token may be lost at '" + block[id].escapes[i] + "'" });
                    reports.push({ id: block[id].escapes[i], message: "May lose token required by  '" + id + "'" });
                  }
                }
              }
//console.log("Reports:", reports);
              for ( let i in reports ) {
                reporter.report(reports[i].id,reports[i].message);
              }

              // remove all nodes between startId and endId
//console.log( "Remove block", block, graph[startId].fork, graph[endId].merge );
              for ( let nodeId in block ) {            
                if ( nodeId != startId && nodeId != endId ) {
                  graph[startId].successors = graph[startId].successors.filter(e => e != nodeId);
                  graph[endId].predecessors = graph[endId].predecessors.filter(e => e != nodeId);
                  delete graph[nodeId];
                  REMOVAL = true;
                }
              }

              if ( REMOVAL ) { 

                mergeUnique( graph[startId].escapes, block[endId].escapes );

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

  function findAcyclicConnectedBlock(startId, endId, graph, force) {
//console.log("findAcyclicEmbeddedStructure",startId, endId,structuredClone(graph),force);
    let visited = {};
    visited[startId] = { escapes: [] };
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
        nodeId = successors.find( i => i != endId && graph[i].predecessors.every(el => visited[el] != undefined) ); 

        if ( nodeId == undefined ) {
          return;
        }
        if ( canLoop(nodeId,graph) ) {
////console.log("loop");
          return;
        }
      }
      else {
        nodeId = endId;
      } 
      visited[nodeId] = { escapes: [] };

//console.log("Node",nodeId,graph[nodeId],endId,successors[0]);

        
      if ( !force 
           && nodeId != endId
           && graph[nodeId].fork 
           && graph[nodeId].fork != graph[startId].fork 
      ) {
        // block is inconsistent
//console.log("INCONSISTENT");
        return;
      }

      if ( !force && graph[nodeId].merge 
           && graph[nodeId].merge != graph[startId].fork                
           && !(graph[nodeId].merge == INCLUSIVE && graph[startId].fork == PARALLEL) 
      ) {
        // block is inconsistent
//console.log("INCONSISTENT");
        return;
      }
      successors = successors.filter(item => item !== nodeId);

      if ( !graph[nodeId].merge || graph[nodeId].merge != INCLUSIVE ) {
        // a node that is not an inclusive merge inherits escapes of predecessors 
        for ( let j in graph[nodeId].predecessors ) {
          const predecessorId = graph[nodeId].predecessors[j];
//console.log("NONINCLUSIVE", nodeId, " inherits ", visited[predecessorId].escapes,graph[predecessorId].escapes);
          mergeUnique( visited[nodeId].escapes, visited[predecessorId].escapes );
          mergeUnique( visited[nodeId].escapes, graph[predecessorId].escapes );
        }
      }
      else if ( graph[nodeId].merge == INCLUSIVE ) {
        // an inclusive merge inherits escapes of predecessors only if all predecessors can escape
        let escapes = graph[nodeId].escapes; 
        for ( let j in graph[nodeId].predecessors ) {
          const predecessorId = graph[nodeId].predecessors[j];
          if ( predecessorId != startId && visited[predecessorId].escapes.length ) {
//console.log("INCLUSIVE", nodeId, " inherits ", visited[predecessorId].escapes,graph[predecessorId].escapes);
            mergeUnique( escapes, visited[predecessorId].escapes );
            mergeUnique( escapes, graph[predecessorId].escapes );
          }
          else {
//console.log("INCLUSIVE", nodeId, " does not inherit from ",visited[predecessorId].escapes,graph[predecessorId].escapes);
            escapes = []; 
            break;
          }
        }
        mergeUnique( visited[nodeId].escapes, escapes );
      }

      // add successors of visited node
      if ( nodeId != endId ) {
        for ( let j in graph[nodeId].successors ) {
          const successorId = graph[nodeId].successors[j];
          if ( !successors.includes(successorId) ) { 
            successors.push(successorId);
          }
        } 
      }
    }
////console.log("F",id,successors,visited);

    return visited;
  }


  function requiredMerge(id,graph,visited,fork) {
    if ( fork != PARALLEL ) {
      return fork;
    }

    for ( let j in graph[id].predecessors ) {
////console.log("RM",id,graph,visited,graph[id].predecessors[j]);
      const predecessorId = graph[id].predecessors[j];
      if ( visited[predecessorId].escapes.length || graph[predecessorId].escapes.length ) {
//console.log("Merge",id,"must be inclusive");
        return INCLUSIVE;
      }
    }

//console.log("Merge",id,"must be parallel");
    return PARALLEL;
  }

  function removeEnd(graph, reporter) {
    let REMOVAL = false;
    for (let id in graph) {
      if ( graph[id].predecessors.length <= 1 
           && graph[id].successors.length == 0
           && graph[id].node.id == id // do not remove clone created for loop
      ) {
//console.log("removeEnd",id);
        removeSequentialNode( graph, id );
        REMOVAL = true;
      }
    }
    return REMOVAL;
  }

  function removeMultipleStarts(graph, reporter) {
    let REMOVAL = false;
    for (let id in graph) {
      if ( graph[id].merge ) {
////console.log("removeAlternativeStart for",id,graph);
        let alternativeStarts = graph[id].predecessors.filter(predecessorId => 
          !canLoop(predecessorId,graph)
          && !graph[predecessorId].fork 
          && graph[predecessorId].predecessors.length == 0
        );
        if ( alternativeStarts.length > 1 ) {
          if ( graph[id].merge != EXCLUSIVE && alternativeStarts.length == 2 ) {
            reporter.report(id, 'Alternative flows into non-exclusive gateway');
          } 
          // remove alternative start
          for (var i = 0; i < alternativeStarts.length; i++) {
//console.log("removeAlternativeStart",alternativeStarts[i]);
            removeSequentialNode( graph, alternativeStarts[i] );
            REMOVAL = true;
          }
        }
      }
    }
    return REMOVAL;
  }

  function removeStart(graph, reporter) {
    let REMOVAL = false;
      while ( removeMultipleStarts(graph, reporter) ) {
//console.log("removeMultipleStarts");
      REMOVAL = true;
    }

    for (let id in graph) {
      if ( graph[id].predecessors.length == 0 
           && graph[id].successors.length <= 1
           && !graph[id].cloned
      ) {
//console.log("removeStart");
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

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
The rule uses reduction rules to iteratively simplify the model and detect anomalies:
- removeIntermediateNodes(graph, reporter)
- removeParallelEnd(graph, reporter)
- removeAlternativeEnds(graph, reporter)
- removeMultipleFlowsBetweenGateways(graph, reporter)
- removeFakeSubProcess(graph, reporter)
- removeFakeSubProcess(graph, reporter, true)
- removeLoop(graph, reporter)
- removeLoop(graph, reporter, true)
*/

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
               && (!is(flowElement, 'bpmn:SubProcess') || !flowElement.triggeredByEvent) 
               && !flowElement.isForCompensation
      });

      // determine non-interrupting boundary events
      const nonInterruptingBoundaryEvents = flowElements.filter(function(flowElement) {
        return is(flowElement, 'bpmn:BoundaryEvent') && flowElement.cancelActivity === false;
      });
////console.log(nonInterruptingBoundaryEvents);
      let illegalJoins = {};
      for ( let i = 0; i < nonInterruptingBoundaryEvents.length; i++) {
        graph = buildAcyclicGraph( [ nonInterruptingBoundaryEvents[i] ], reporter );
        // flows of non-interrupting boundary events must be disjunct
        for (let id in graph) {
          if ( graph[id].node.id != id ) {
            // node had been cloned due to incoming flow from unknown node
            const node = graph[id].node;
            if ( graph[id].node.incoming && graph[id].node.incoming.length > graph[node.id].predecessors.length + graph[id].predecessors.length ) {
              illegalJoins[node.id] = node.id;
            }
          }
        }
        validate( graph, reporter );
////console.log("BB Final",graph);
      }
      for (let id in illegalJoins) {
        reporter.report(id, 'Illegal join of flows');
      }

      // determine interrupting boundary events
      interruptingBoundaryEvents = flowElements.filter(function(flowElement) {
        return is(flowElement, 'bpmn:BoundaryEvent') && flowElement.cancelActivity !== false;
      });

////console.log(interruptingBoundaryEvents);

      // determine starting nodes
      const startingNodes = flowElements.filter(function(flowElement) {
        return is(flowElement, 'bpmn:FlowNode') 
               && (!flowElement.incoming || flowElement.incoming.length == 0) 
               && (!is(flowElement, 'bpmn:SubProcess') || !flowElement.triggeredByEvent)
               && !flowElement.isForCompensation
               && !is(flowElement, 'bpmn:BoundaryEvent');
      });
//console.log([...startingNodes]);
 
      if ( startingNodes.length == 1 ) {
        graph = buildAcyclicGraph( startingNodes, reporter );
//console.log("Initial",structuredClone(graph));
        validate( graph, reporter );
//console.log("Final",structuredClone(graph));

        // report all unreachable nodes
        for (let i in flowNodes) {
          reporter.report(flowNodes[i].id, 'Node unreachable');
        }
      }
      else {
        for (let i in startingNodes) {
          reporter.report(startingNodes[i].id, 'Multiple start events');
        }
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
      if ( is(nodes[i],'bpmn:BoundaryEvent') && graph[ nodes[i].attachedToRef.id ]  == undefined ) {
        selected = false;
      }
      if ( selected ) {
        return i;
      }
    }
    return;
  }

  function insert( nodes, i, graph) {
    const node = nodes[i || 0];
//console.log("Insert",i,node,structuredClone(graph));
    graph[node.id] = { node, successors: [], predecessors: [], merge: getMergeBehaviour(node), fork: getForkBehaviour(node), escapes: [] };
    if ( i == undefined ) {
      // duplicate node
      graph[node.id].cloned = true;
      graph[node.id + '_clone'] = { node: nodes[0], successors: [], predecessors: [], merge: getMergeBehaviour(node), fork: getForkBehaviour(node), escapes: [] };
    }

//    const node = nodes[i || 0];
    update(graph, node);
    nodes.splice(i || 0, 1);
    // remove node from set of nodes that have not been reached yet
    flowNodes = flowNodes.filter( e => e.id != node.id);

    // add subsequent nodes
    if ( node.outgoing ) {
      for (let j in node.outgoing ) {
        let successor = node.outgoing[j].targetRef;
        if ( graph[successor.id] == undefined && !nodes.includes(successor) ) {
////console.log("Add",successor);
          nodes.push(successor);
        }
      }
    }

    // add all boundary event nodes
    const boundaryEvents = interruptingBoundaryEvents.filter( e => e.attachedToRef.id == node.id);
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
////console.log("NO",node,node.outgoing,node.outgoing[i]);
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

  function canLoop(id,graph) {
    return graph[id].cloned || graph[id].node.id != id;
  }

/************************************************/
/** Simplify graph                             **/
/************************************************/
  function simplifyGraph( graph, reporter ) {
    while ( removeIntermediateNodes(graph, reporter)
//            || removeMultipleStarts(graph, reporter)
            || removeParallelEnd(graph, reporter)
            || removeAlternativeEnds(graph, reporter)
            || removeMultipleFlowsBetweenGateways(graph, reporter)
            || removeFakeSubProcess(graph, reporter)
            || removeFakeSubProcess(graph, reporter, true)
            || removeLoop(graph, reporter)
            || removeLoop(graph, reporter, true)
//            || removeAnomalLoop(graph, reporter)
    ) {
      //console.log("Graph",structuredClone(graph));
    }
    removeEnd(graph, reporter)
    removeStart(graph, reporter)
  }



  function removeNode( graph, id ) {
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
////console.log("removeIntermediateNodes");
    let REMOVAL = false;
    for (let id in graph) {
      if ( graph[id].predecessors.length == 1 
           && graph[id].successors.length == 1
           && !canLoop( id,graph )
      ) {
        if ( !graph[id].escapes.length  ) {
//console.log("removeIntermediateNodes",id);
          removeNode( graph, id );
          REMOVAL = true;
        }
        else if ( !graph[ graph[id].predecessors[0] ].fork ) {
          const predecessorId = graph[id].predecessors[0];
          mergeUnique( graph[predecessorId].escapes, graph[id].escapes);
//          graph[predecessorId].escapes = graph[predecessorId].escapes.concat(graph[id].escapes);
//console.log("removeIntermediateNodes",id);
          removeNode( graph, id );
          REMOVAL = true;
        }
      }
    }
    return REMOVAL;
  }
/*
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
          for (var i = 1; i < alternativeStarts.length; i++) {
//console.log("removeAlternativeStart",alternativeStarts[i]);
            removeNode( graph, alternativeStarts[i] );
            REMOVAL = true;
          }
        }
      }
    }
    return REMOVAL;
  }
*/

  function removeParallelEnd(graph, reporter) {
////console.log("removeParallelEnd");
    let REMOVAL = false;
    for (let id in graph) {
      if ( graph[id].successors.length == 0 
           && graph[id].predecessors.length == 1 
           && graph[id].node.id == id // exclude clone created for loop 
      ) {
        const predecessorId = graph[id].predecessors[0];
        if ( graph[predecessorId].fork == PARALLEL ) {
//console.log("removeParallelEnd",id);
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
          removeNode( graph, alternativeEnds[i] );
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
////console.log("removeMultipleFlowsBetweenGateways");
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
////console.log("removeSimpleLoop",id);
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
            reporter.report(cycleNodes[i],"Potential deadlock because of loop");
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

  function removeFakeSubProcess(graph, reporter, force) {
    let REMOVAL = false;
    for (let id in graph) {
      if ( graph[id].fork ) {
        let structure = findAcyclicEmbeddedStructure(id, graph, force);
        if ( structure ) {
          // remove all visited nodes between graph[id] and graph[successors[0]]
//console.log( "Remove structure", structure, graph[structure.startId].fork, graph[structure.endId].merge );
          // detect non-matching gateways
          let reports = []
          for ( let id in structure.nodes ) {
            if ( graph[id].fork && graph[id].fork != graph[structure.startId].fork ) {
              reports.push({ id, message: "Fork inconsistent with fork at '" + structure.startId + "'" });
              reports.push({ id: structure.startId, message: "Fork inconsistent with fork at '" + id + "'" });
            } 
            if ( id != structure.startId 
                 && graph[id].merge 
                 && graph[id].merge != graph[structure.startId].fork
                 && graph[id].merge != requiredMerge(id,graph,structure.nodes,graph[structure.startId].fork)
            ) {
              reports.push({ id, message: "Merge inconsistent with fork at '" + structure.startId + "'" });
              reports.push({ id: structure.startId, message: "Fork inconsistent with merge at '" + id + "'" });
            } 
          }        
/*
          if ( reports.length > 0 ) {
            reports.push({ id: structure.endId, message: "Inconsistent gateway(s) starting with '" + structure.startId + "'" });
            reports.push({ id: structure.startId, message: "Inconsistent gateway(s) ending with '" + structure.endId + "'" });
          }
*/
          for ( let id in structure.nodes ) {
            if ( id != structure.startId 
                 && graph[structure.startId].fork == PARALLEL
                 && graph[id].merge == PARALLEL
            ) {
              for ( let i in structure.nodes[id].escapes ) {
                reports.push({ id, message: "Required token may be lost at '" + structure.nodes[id].escapes[i] + "'" });
                reports.push({ id: structure.nodes[id].escapes[i], message: "May lose token required by  '" + id + "'" });
              }
            }
          }
//console.log("Reports:", reports);
          for ( let i in reports ) {
            reporter.report(reports[i].id,reports[i].message);
          }

          let escapes = [];
          for ( let i in graph[ structure.endId ].predecessors ) {
            const predecessorId = graph[ structure.endId ].predecessors[i];
            mergeUnique( escapes, structure.nodes[predecessorId].escapes );
            //escapes = escapes.concat( structure.nodes[predecessorId].escapes );            
          }

          for ( let nodeId in structure.nodes ) {            
            if ( nodeId != structure.startId && nodeId != structure.endId ) {
              graph[structure.startId].successors = graph[structure.startId].successors.filter(e => e != nodeId);
              graph[structure.endId].predecessors = graph[structure.endId].predecessors.filter(e => e != nodeId);
              delete graph[nodeId];
              REMOVAL = true;
            }
          }
          if ( REMOVAL ) { 
            mergeUnique( graph[structure.startId].escapes, escapes );
            //graph[structure.startId].escapes = graph[structure.startId].escapes.concat(escapes);

            // ensure there is a flow between start and end of structure
            if ( !graph[structure.startId].successors.includes(structure.endId) ) {
              graph[structure.startId].successors.push(structure.endId);
            }
            if ( !graph[structure.endId].predecessors.includes(structure.startId) ) {
              graph[structure.endId].predecessors.push(structure.startId);
            }
            if ( graph[structure.startId].successors.length <= 1 ) {
              graph[structure.startId].fork = undefined;
            }
            if ( graph[structure.endId].predecessors.length <= 1 ) {
              graph[structure.endId].merge = undefined;
            }
          }
        }
      }
    }
    return REMOVAL;
  }

  function requiredMerge(id,graph,visited,fork) {
    if ( fork != PARALLEL ) {
      return fork;
    }
    for ( let j in graph[id].predecessors ) {
////console.log("RM",id,graph,visited,graph[id].predecessors[j]);
      const predecessorId = graph[id].predecessors[j];
      if ( visited[predecessorId].escapes.length ) {
        return INCLUSIVE;
      }
    }
    return PARALLEL;
  }

  function findAcyclicEmbeddedStructure(id, graph, force) {
////console.log("findAcyclicEmbeddedStructure",id,force);
    let visited = {};
    visited[id] = { escapes: [...graph[id].escapes] };
    let successors = [];
    for ( let j in graph[id].successors ) {
      const successorId = graph[id].successors[j];
////console.log(successors,successorId,successors.includes(successorId));
      if ( !successors.includes(successorId) ) { 
        successors.push(successorId);
      }
    } 

    if ( successors.length <= 1 ) {
      return;
    } 
    
    let endId = undefined;
    while ( successors.length > 0 ) {
////console.log(id,successors,visited);
      const nodeId = successors.find( i => graph[i].predecessors.every(el => visited[el] != undefined) );

////console.log("X",id,successors,visited,nodeId);
      if ( nodeId == undefined ) {
        return;
      }

      if ( canLoop(nodeId,graph) ) {
////console.log("loop");
        return;
      }
        
      if ( !force && graph[nodeId].fork && graph[nodeId].fork != graph[id].fork ) {
        // gateway types do not match
        return;
      }

      if ( !force && graph[nodeId].merge 
           && graph[nodeId].merge != graph[id].fork                
           && !(graph[nodeId].merge == INCLUSIVE && graph[id].fork == PARALLEL) 
      ) {
        // gateway types do not match
        return;
      }

      visited[nodeId] = { escapes: [...graph[nodeId].escapes] };
      successors = successors.filter(item => item !== nodeId);

      if ( !graph[nodeId].merge || graph[nodeId].merge != INCLUSIVE ) {
        // a node that is not an inclusive merge inherits escapes of predecessors 
        for ( let j in graph[nodeId].predecessors ) {
          const predecessorId = graph[nodeId].predecessors[j];
////console.log(nodeId, " inherits ", visited[predecessorId].escapes);
          mergeUnique( visited[nodeId].escapes, visited[predecessorId].escapes );
          //visited[nodeId].escapes = visited[nodeId].escapes.concat(visited[predecessorId].escapes);
        }
      }
      else if ( graph[nodeId].merge == INCLUSIVE ) {
        // an inclusive merge inherits escapes of predecessors only if all predecessors can escape
        let escapes = []; 
        for ( let j in graph[nodeId].predecessors ) {
          const predecessorId = graph[nodeId].predecessors[j];
          if ( visited[predecessorId].escapes.length ) {
            mergeUnique( escapes, visited[predecessorId].escapes );
//            escapes = escapes.concat(visited[predecessorId].escapes);
          }
          else {
            escapes = []; 
            break
          }
        }
        mergeUnique( visited[nodeId].escapes, escapes );
//        visited[nodeId].escapes = visited[nodeId].escapes.concat(escapes);
      }
////console.log("XXX",id,successors,visited,nodeId);

      if ( successors.length == 0 ) {
        endId = nodeId;
////console.log("End",endId)
        break;
      }

      // add successor of visited node
      for ( let j in graph[nodeId].successors ) {
        const successorId = graph[nodeId].successors[j];
        if ( !successors.includes(successorId) ) { 
          successors.push(successorId);
        }
      } 
    }
////console.log("F",id,successors,visited);

    if ( endId ) {
      return { startId: id, endId, nodes: visited };
    }
  }

  function removeAnomalLoop(graph, reporter) {
    let REMOVAL = false;
    for (let id in graph) {
      if ( graph[id].cloned ) {
//console.log("removeAnomalLoop",id);
        reporter.report(id, 'Anomal loop');
        delete graph[id].cloned;
        removeNode( graph, id + '_clone' ); // remove clone
        REMOVAL = true;
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
//console.log("removeEnd",id);
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
//console.log("removeStart");
        removeNode( graph, id );
        REMOVAL = true;
        break;
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

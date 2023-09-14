import { without } from 'min-dash';

import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

import {
  createElement,
  nextId
} from '../utils/ElementUtil';

import { 
  CollapsibleEntry,
  ListEntry 
} from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';

import OperatorEntries from './OperatorEntries';


export default function OperatorsList(props) {
  const {
    element,
    idPrefix,
    guidance
  } = props;

  const id = `${ idPrefix }-operators`;

  const bpmnFactory = useService('bpmnFactory');
  const commandStack = useService('commandStack');
  const translate = useService('translate');

  const businessObject = getBusinessObject(element);

  let parent = guidance.get('operators') || [];
  const operators = parent.length && parent[0].operator || [];

  function addFactory() {
    let operatorList = guidance.operators ? guidance.get('operators')[0] : undefined;
    if ( !operatorList ) {
      // create 'execution:Operators'
      operatorList = createElement('execution:Operators', {}, guidance, bpmnFactory);
      commandStack.execute('element.updateModdleProperties', {
          element,
          moddleElement: guidance,
          properties: {
            operators: [ ...guidance.get('operators'), operatorList ]
          }
      });
    }

    // create 'execution:Operator'
    const operator = createElement('execution:Operator', { id: nextId('Operator_') , type: 'xs:decimal' }, operatorList, bpmnFactory);

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: operatorList,
      properties: {
        operator: [ ...operatorList.get('operator'), operator ]
      }
    });
  }

  function removeFactory(operator) {
    let operatorList = guidance.operators ? guidance.get('operators')[0] : undefined;

    if (!operatorList) {
      return;
    }

    const commands = [];

    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: operatorList,
        properties: {
          operator: without(operatorList.get('operator'), operator)
        }
      }
    });

    // remove 'execution:Operators' if last operator removed
    if ( guidance.get('operators')[0].get('operator').length <= 1) {
      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: guidance,
          properties: {
            operators: undefined
          }
        }
      });
    }

    commandStack.execute('properties-panel.multi-command-executor', commands);

  }

  return <ListEntry
    element={ element }
    id={ id }
    label={ translate('Operators') }
    items={ operators }
    component={ Operator }
    onAdd={ addFactory }
    onRemove={ removeFactory } />;
}

function Operator(props) {
  const {
    element,
    id,
    index,
    item,
    open
  } = props;

  const operator = item;
  const translate = useService('translate');

  return (
    <CollapsibleEntry
      id={ id }
      element={ element }
      entries={ OperatorEntries({
        idPrefix: id,
        element,
        operator
      }) }
      label={ operator.get('attribute') || translate('<empty>') }
      open={ open }
    />
  );
}

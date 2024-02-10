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

import RestrictionEntries from './RestrictionEntries';


export default function RestrictionsList(props) {
  const {
    element,
    idPrefix,
    guidance
  } = props;

  const id = `${ idPrefix }-restrictions`;

  const bpmnFactory = useService('bpmnFactory');
  const commandStack = useService('commandStack');
  const translate = useService('translate');

  const businessObject = getBusinessObject(element);

  let parent = guidance.get('restrictions') || [];
  const restrictions = parent.length && parent[0].restriction || [];

  function addFactory() {
    let restrictionList = guidance.restrictions ? guidance.get('restrictions')[0] : undefined;
    if ( !restrictionList ) {
      // create 'bpmnos:Restrictions'
      restrictionList = createElement('bpmnos:Restrictions', {}, guidance, bpmnFactory);
      commandStack.execute('element.updateModdleProperties', {
          element,
          moddleElement: guidance,
          properties: {
            restrictions: [ ...guidance.get('restrictions'), restrictionList ]
          }
      });
    }

    // create 'bpmnos:Restriction'
    const restriction = createElement('bpmnos:Restriction', { id: nextId('Restriction_') , type: 'decimal' }, restrictionList, bpmnFactory);

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: restrictionList,
      properties: {
        restriction: [ ...restrictionList.get('restriction'), restriction ]
      }
    });
  }

  function removeFactory(restriction) {
    let restrictionList = guidance.restrictions ? guidance.get('restrictions')[0] : undefined;

    if (!restrictionList) {
      return;
    }

    const commands = [];

    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: restrictionList,
        properties: {
          restriction: without(restrictionList.get('restriction'), restriction)
        }
      }
    });

    // remove 'bpmnos:Restrictions' if last restriction removed
    if ( guidance.get('restrictions')[0].get('restriction').length <= 1) {
      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: guidance,
          properties: {
            restrictions: undefined
          }
        }
      });
    }

    commandStack.execute('properties-panel.multi-command-executor', commands);

  }

  return <ListEntry
    element={ element }
    id={ id }
    label={ translate('Restrictions') }
    items={ restrictions }
    component={ Restriction }
    onAdd={ addFactory }
    onRemove={ removeFactory } />;
}

function Restriction(props) {
  const {
    element,
    id,
    index,
    item,
    open
  } = props;

  const restriction = item;
  const translate = useService('translate');

  return (
    <CollapsibleEntry
      id={ id }
      element={ element }
      entries={ RestrictionEntries({
        idPrefix: id,
        element,
        restriction
      }) }
      label={ restriction.get('attribute') || translate('<empty>') }
      open={ open }
    />
  );
}

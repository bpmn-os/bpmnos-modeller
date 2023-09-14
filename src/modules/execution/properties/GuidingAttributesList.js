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

import AttributeEntries from './AttributeEntries';


export default function AttributesList(props) {
  const {
    element,
    idPrefix,
    guidance
  } = props;

  const id = `${ idPrefix }-attributes`;

  const bpmnFactory = useService('bpmnFactory');
  const commandStack = useService('commandStack');
  const translate = useService('translate');

  const businessObject = getBusinessObject(element);

  let parent = guidance.get('attributes') || [];
  const attributes = parent.length && parent[0].attribute || [];

  function addFactory() {
    let attributeList = guidance.attributes ? guidance.get('attributes')[0] : undefined;
    if ( !attributeList ) {
      // create 'execution:Attributes'
      attributeList = createElement('execution:Attributes', {}, guidance, bpmnFactory);
      commandStack.execute('element.updateModdleProperties', {
          element,
          moddleElement: guidance,
          properties: {
            attributes: [ ...guidance.get('attributes'), attributeList ]
          }
      });
    }

    // create 'execution:Attribute'
    const attribute = createElement('execution:Attribute', { id: nextId('Attribute_') , type: 'xs:decimal' }, attributeList, bpmnFactory);

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: attributeList,
      properties: {
        attribute: [ ...attributeList.get('attribute'), attribute ]
      }
    });
  }

  function removeFactory(attribute) {
    let attributeList = guidance.attributes ? guidance.get('attributes')[0] : undefined;

    if (!attributeList) {
      return;
    }

    const commands = [];

    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: attributeList,
        properties: {
          attribute: without(attributeList.get('attribute'), attribute)
        }
      }
    });

    // remove 'execution:Attributes' if last attribute removed
    if ( guidance.get('attributes')[0].get('attribute').length <= 1) {
      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: guidance,
          properties: {
            attributes: undefined
          }
        }
      });
    }

    commandStack.execute('properties-panel.multi-command-executor', commands);

  }

  return <ListEntry
    element={ element }
    id={ id }
    label={ translate('Attributes') }
    items={ attributes }
    component={ Attribute }
    onAdd={ addFactory }
    onRemove={ removeFactory } />;
}

function Attribute(props) {
  const {
    element,
    id,
    index,
    item,
    open
  } = props;

  const attribute = item;
  const translate = useService('translate');

  return (
    <CollapsibleEntry
      id={ id }
      element={ element }
      entries={ AttributeEntries({
        idPrefix: id,
        element,
        attribute
      }) }
      label={ attribute.get('name') || translate('<empty>') }
      open={ open }
    />
  );
}

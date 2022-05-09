import { ListEntry, TextFieldEntry } from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';

import { Content, ContentEntries } from './ContentEntries';
import { Parameter, ParameterEntries } from './ParameterEntries';

import {
  createElement,
  nextId
} from '../utils/ElementUtil';

import {
  getCustomItem,
  ensureCustomItem
} from '../utils/CustomItemUtil';

import { without } from 'min-dash';

export default function MessageEntries(props) {
  const {
    idPrefix,
    message
  } = props;

  const entries = [
   {
    id: idPrefix + '-name',
    component: MessageName,
    idPrefix,
    message
   },
   {
    id: idPrefix + '-parameters',
    component: MessageParameters,
    idPrefix,
    message
   },
   {
    id: idPrefix + '-content',
    component: MessageContent,
    idPrefix,
    message
   }
  ];

  return entries;
}

function MessageName(props) {
  const {
    idPrefix,
    element,
    message
  } = props;

  const bpmnFactory = useService('bpmnFactory');
  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {

    // ensure 'execution:Message'
    let message = ensureCustomItem(bpmnFactory, commandStack, element, 'execution:Message'); 

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: message,
      properties: {
        name: value
      }
    });
  };

  const getValue = () => {
    if ( message ) {
      return message.name;
    }
  };

  return TextFieldEntry({
    element: message,
    id: idPrefix + '-name',
    label: translate('Name'),
    getValue,
    setValue,
    debounce
  });
}

function MessageParameters(props) {
  const {
    id,
    element,
    message
  } = props;

  const bpmnFactory = useService('bpmnFactory');
  const commandStack = useService('commandStack');
  const translate = useService('translate');

  let parameter = (message || {}).parameter;

  function addParameter() {
    let commands = [];

    let message = ensureCustomItem(bpmnFactory, commandStack, element, 'execution:Message'); 
    
    // create parameter
    const parameter = createElement('execution:Parameter', {}, message, bpmnFactory);

    commands.push({
      cmd:'element.updateModdleProperties', 
      context: {
        element,
        moddleElement: message,
        properties: {
          parameter: [ ...message.get('parameter'), parameter ]
        }
      }
    });

    // commit all updates
    commandStack.execute('properties-panel.multi-command-executor', commands);

  }

  function removeParameter(parameter) {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: message,
      properties: {
        parameter: without(message.get('parameter'), parameter)
      }
    });
  }

  function compareName(parameter, anotherParameter) {
    const [ name = '', anotherName = '' ] = [ parameter.name, anotherParameter.name ];

    return name === anotherName ? 0 : name > anotherName ? 1 : -1;
  }

  return <ListEntry
    id={ id }
    element={ element }
    label={ translate('Parameters') }
    items={ parameter }
    component={ Parameter }
    onAdd={ addParameter }
    onRemove={ removeParameter }
    compareFn={ compareName }
    autoFocusEntry
  />;
}

function MessageContent(props) {
  const {
    id,
    element,
    message
  } = props;

  const bpmnFactory = useService('bpmnFactory');
  const commandStack = useService('commandStack');
  const translate = useService('translate');

  let content = (message || {}).content;

  function addContent() {
    let commands = [];

    // ensure 'execution:Message'
    let message = ensureCustomItem(bpmnFactory, commandStack, element, 'execution:Message'); 

    // create 'execution:Content'
    const content = createElement('execution:Content', { id: nextId('Content_') }, message, bpmnFactory);

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: message,
      properties: {
        content: [ ...message.get('content'), content ]
      }
    });
  }

  function removeContent(content) {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: message,
      properties: {
        content: without(message.get('content'), content)
      }
    });
  }

  function compareKey(content, anotherContent) {
    const [ key = '', anotherKey = '' ] = [ content.key, anotherContent.key ];

    return key === anotherKey ? 0 : key > anotherKey ? 1 : -1;
  }

  return <ListEntry
    id={ id }
    element={ element }
    label={ translate('Message content') }
    items={ content }
    component={ Content }
    onAdd={ addContent }
    onRemove={ removeContent }
    compareFn={ compareKey }
    autoFocusEntry
  />;
}



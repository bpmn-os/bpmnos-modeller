import { ListEntry, TextFieldEntry } from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';

import { Content, ContentEntries } from './ContentEntries';

import {
  createElement,
  nextId
} from '../utils/ElementUtil';

import { without } from 'min-dash';

export default function RequestEntries(props) {
  const {
    idPrefix,
    request
  } = props;

  const entries = [ {
    id: idPrefix + '-id',
    component: RequestId,
    idPrefix,
    request
   },
   {
    id: idPrefix + '-request-message',
    name: "Request message",
    component: MessageContent,
    idPrefix,
    request
   },
   {
    id: idPrefix + '-ready-message',
    name: "Ready message",
    component: MessageContent,
    idPrefix,
    request
   },
   {
    id: idPrefix + '-start-message',
    name: "Start message",
    component: MessageContent,
    idPrefix,
    request
   }
  ];

  return entries;
}

function RequestId(props) {
  const {
    idPrefix,
    element,
    request
  } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: request,
      properties: {
        id: value
      }
    });
  };

  const getValue = () => {
    return request.id;
  };

  return TextFieldEntry({
    element: request,
    id: idPrefix + '-id',
    label: translate('Id'),
    getValue,
    setValue,
    debounce
  });
}

function MessageContent(props) {
  const {
    id,
    name,
    element,
    request
  } = props;

  const bpmnFactory = useService('bpmnFactory');
  const commandStack = useService('commandStack');
  const translate = useService('translate');

  const messages = request.get('message') || [];
  let message = messages.find(message => message.name == name);

  let content = (message || {}).content || [];

  function addContent() {
    let commands = [];

    // ensure 'execution:Message' with given name
    if (!message) {
      message = createElement('execution:Message', { name }, request, bpmnFactory);

      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: request,
          properties: {
            message: [ ...messages, message ]
          }
        }
      });
    }
    // create content
    const content = createElement('execution:Content', { id: nextId('Content_') }, message, bpmnFactory);

    commands.push({
      cmd:'element.updateModdleProperties', 
      context: {
        element,
        moddleElement: message,
        properties: {
          content: [ ...message.get('content'), content ]
        }
      }
    });

    // commit all updates
    commandStack.execute('properties-panel.multi-command-executor', commands);

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
    label={ translate(name) }
    items={ content }
    component={ Content }
    onAdd={ addContent }
    onRemove={ removeContent }
    compareFn={ compareKey }
    autoFocusEntry
  />;
}


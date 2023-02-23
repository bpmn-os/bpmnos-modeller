import { ListEntry, TextFieldEntry } from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';

import { Content, ContentEntries } from './ContentEntries';

import {
  createElement,
  nextId
} from '../utils/ElementUtil';

import { without } from 'min-dash';

export default function releaseEntries(props) {

  const {
    idPrefix,
    release
  } = props;

  const entries = [ {
    id: idPrefix + '-id',
    component: ReleaseId,
    idPrefix,
    release
   },
   {
    id: idPrefix + '-request',
    component: ReleaseRequest,
    idPrefix,
    release
   },
   {
    id: idPrefix + '-release-message',
    name: "Release message",
    component: MessageContent,
    idPrefix,
    release
   },
   {
    id: idPrefix + '-fulfilment-message',
    name: "Fulfilment message",
    component: MessageContent,
    idPrefix,
    release
   },
   {
    id: idPrefix + '-clearance-message',
    name: "Clearance message",
    component: MessageContent,
    idPrefix,
    release
   }
  ];

  return entries;
}

function ReleaseId(props) {
  const {
    idPrefix,
    element,
    release
  } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: release,
      properties: {
        id: value
      }
    });
  };

  const getValue = () => {
    return release.id;
  };

  return TextFieldEntry({
    element: release,
    id: idPrefix + '-id',
    label: translate('Id'),
    getValue,
    setValue,
    debounce
  });
}

function ReleaseRequest(props) {
  const {
    idPrefix,
    element,
    release
  } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: release,
      properties: {
        request: value
      }
    });
  };

  const getValue = () => {
    return release.request;
  };

  const validate = (value) => {
    if ( !value || value.trim() == "" ) {
      return 'Id must not be empty.';
    }
  }

  return TextFieldEntry({
    element: release,
    id: idPrefix + '-request',
    label: translate('Id of request to be released'),
    validate,
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
    release
  } = props;

  const bpmnFactory = useService('bpmnFactory');
  const commandStack = useService('commandStack');
  const translate = useService('translate');

  const messages = release.get('message') || [];
  let message = messages.find(message => message.name == name);

  let content = (message || {}).content || [];

  function addContent() {
    let commands = [];

    // ensure 'execution:Message' with given name
    if (!message) {
      message = createElement('execution:Message', { name }, release, bpmnFactory);

      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: release,
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


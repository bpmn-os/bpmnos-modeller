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

export default function SignalEntries(props) {
  const {
    element,
    idPrefix,
    signal
  } = props;

  const entries = [
   {
    id: idPrefix + '-name',
    component: SignalName,
    idPrefix,
    signal
   },
   {
    id: idPrefix + '-content',
    component: SignalContent,
    idPrefix,
    signal
   }
  ];

  return entries;
}

function SignalName(props) {
  let {
    idPrefix,
    element,
    signal
  } = props;

  const bpmnFactory = useService('bpmnFactory');
  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {

    if ( !signal ) {
      // ensure 'bpmnos:Signal'
      signal = ensureCustomItem(bpmnFactory, commandStack, element, 'bpmnos:Signal'); 
    }

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: signal,
      properties: {
        name: value
      }
    });
  };

  const getValue = () => {
    if ( signal ) {
      return signal.name;
    }
  };

  const validate = (value) => {
    if ( !value || value.trim() == "" ) {
      return 'Name must not be empty.';
    }
  }

  return TextFieldEntry({
    element: signal,
    id: idPrefix + '-name',
    label: translate('Name'),
    validate,
    getValue,
    setValue,
    debounce
  });
}

function SignalContent(props) {
  let {
    id,
    element,
    signal
  } = props;

  const bpmnFactory = useService('bpmnFactory');
  const commandStack = useService('commandStack');
  const translate = useService('translate');

  let content = (signal || {}).content;

  function addContent() {
    let commands = [];

    if ( !signal ) {
      // ensure 'bpmnos:Signal'
      signal = ensureCustomItem(bpmnFactory, commandStack, element, 'bpmnos:Signal'); 
    }
    // create 'bpmnos:Content'
    const content = createElement('bpmnos:Content', { id: nextId('Content_') }, signal, bpmnFactory);

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: signal,
      properties: {
        content: [ ...signal.get('content'), content ]
      }
    });
  }

  function removeContent(content) {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: signal,
      properties: {
        content: without(signal.get('content'), content)
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
    label={ translate('Signal content') }
    items={ content }
    component={ Content }
    onAdd={ addContent }
    onRemove={ removeContent }
    compareFn={ compareKey }
    autoFocusEntry
  />;
}



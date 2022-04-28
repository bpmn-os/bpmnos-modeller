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
    id: idPrefix + '-job-content',
    component: JobContent,
    idPrefix,
    request
   },
   {
    id: idPrefix + '-response-content',
    component: ResponseContent,
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

function JobContent(props) {
  const {
    id,
    element,
    request
  } = props;

  const bpmnFactory = useService('bpmnFactory');
  const commandStack = useService('commandStack');
  const translate = useService('translate');

  const jobs = request.get('job');

  let content = [];
  if ( jobs && jobs.length > 0 ) {
    content = jobs[0].content;
  }

  function addContent() {
    let commands = [];

    // ensure 'execution:Job'
    let jobs = request.get('job');
    var job;
    if ( !jobs || jobs.length == 0) {
      job = createElement('execution:Job', {}, request, bpmnFactory);

      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: request,
          properties: {
            job: [ ...request.get('job'), job ]
          }
        }
      });

    }
    else {
      job = jobs[0];
    }

    // create content
    const content = createElement('execution:Content', { id: nextId('Content_') }, job, bpmnFactory);

    commands.push({
      cmd:'element.updateModdleProperties', 
      context: {
        element,
        moddleElement: job,
        properties: {
          content: [ ...job.get('content'), content ]
        }
      }
    });

    // commit all updates
    commandStack.execute('properties-panel.multi-command-executor', commands);

  }

  function removeContent(content) {
    let job = request.get('job')[0];
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: job,
      properties: {
        content: without(job.get('content'), content)
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
    label={ translate('Job content') }
    items={ content }
    component={ Content }
    onAdd={ addContent }
    onRemove={ removeContent }
    compareFn={ compareKey }
    autoFocusEntry
  />;
}

function ResponseContent(props) {
  const {
    id,
    element,
    request
  } = props;

  const bpmnFactory = useService('bpmnFactory');
  const commandStack = useService('commandStack');
  const translate = useService('translate');

  const responses = request.get('response');

  let content = [];
  if ( responses && responses.length > 0 ) {
    content = responses[0].content;
  }

  function addContent() {
    let commands = [];

    // ensure 'execution:Response'
    let responses = request.get('response');
    var response;
    if ( !responses || responses.length == 0) {
      response = createElement('execution:Response', {}, request, bpmnFactory);

      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: request,
          properties: {
            response: [ ...request.get('response'), response ]
          }
        }
      });

    }
    else {
      response = responses[0];
    }

    // create content
    const content = createElement('execution:Content', { id: nextId('Content_') }, response, bpmnFactory);

    commands.push({
      cmd:'element.updateModdleProperties', 
      context: {
        element,
        moddleElement: response,
        properties: {
          content: [ ...response.get('content'), content ]
        }
      }
    });

    // commit all updates
    commandStack.execute('properties-panel.multi-command-executor', commands);

  }

  function removeContent(content) {
    let response = request.get('response')[0];
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: response,
      properties: {
        content: without(response.get('content'), content)
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
    label={ translate('Response') }
    items={ content }
    component={ Content }
    onAdd={ addContent }
    onRemove={ removeContent }
    compareFn={ compareKey }
    autoFocusEntry
  />;
}



import { ListEntry, TextFieldEntry } from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';

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

  return TextFieldEntry({
    element: release,
    id: idPrefix + '-request',
    label: translate('Id of request to be released'),
    getValue,
    setValue,
    debounce
  });
}


import { CollapsibleEntry, TextFieldEntry } from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';

export function Content(props) {
  const {
    element,
    id: idPrefix,
    index,
    item: content,
    open
  } = props;

  const contentId = `${ idPrefix }-${ index }`;

  return (
    <CollapsibleEntry
      id={ contentId }
      entries={ ContentEntries({
        element,
        content,
        idPrefix: contentId
      }) }
      label={ content.get('key') || content.get('id') }
      open={ open }
    />
  );

}

export function ContentEntries(props) {
  const {
    idPrefix,
    element,
    content
  } = props;

  const entries = [ {
    id: idPrefix + '-id',
    component: ContentId,
    idPrefix,
    content
  },{
    id: idPrefix + '-key',
    component: ContentKey,
    idPrefix,
    content
  },{
    id: idPrefix + '-attribute',
    component: ContentAttribute,
    idPrefix,
    content
  },{
    id: idPrefix + '-value',
    component: ContentValue,
    idPrefix,
    content
  }
 ];

  return entries;
}

function ContentId(props) {
  const {
    idPrefix,
    content
  } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element: content,
      moddleElement: content,
      properties: {
        id: value
      }
    });
  };

  const getValue = () => {
    return content.id;
  };

  return TextFieldEntry({
    element: content,
    id: idPrefix + '-id',
    label: translate('Id'),
    getValue,
    setValue,
    debounce
  });
}

function ContentKey(props) {
  const {
    idPrefix,
    element,
    content
  } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element: content,
      moddleElement: content,
      properties: {
        key: value
      }
    });
  };

  const getValue = () => {
    return content.key;
  };

  const validate = (value) => {
    if ( !value || value.trim() == "" ) {
      return 'Key must not be empty.';
    }
  }

  return TextFieldEntry({
    element: content,
    id: idPrefix + '-key',
    label: translate('Key'),
    validate,
    getValue,
    setValue,
    debounce
  });
}

function ContentAttribute(props) {
  const {
    idPrefix,
    element,
    content
  } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element: content,
      moddleElement: content,
      properties: {
        attribute: value
      }
    });
  };

  const getValue = () => {
    return content.attribute;
  };

  return TextFieldEntry({
    element: content,
    id: idPrefix + '-attribute',
    label: translate('Attribute name'),
    getValue,
    setValue,
    debounce
  });
}

function ContentValue(props) {
  const {
    idPrefix,
    element,
    content
  } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element: content,
      moddleElement: content,
      properties: {
        value
      }
    });
  };

  const getValue = () => {
    return content.value;
  };

  return TextFieldEntry({
    element: content,
    id: idPrefix + '-value',
    label: translate('Value'),
    getValue,
    setValue,
    debounce
  });
}



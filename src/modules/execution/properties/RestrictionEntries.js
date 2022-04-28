import { CheckboxEntry, TextFieldEntry, ListEntry } from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';

import {
  createElement
} from '../utils/ElementUtil';

import { without } from 'min-dash';

export default function RestrictionEntries(props) {

  const {
    idPrefix,
    element,
    restriction
  } = props;

  const entries = [ {
    id: idPrefix + '-id',
    component: RestrictionId,
    idPrefix,
    restriction
  },{
    id: idPrefix + '-attribute',
    component: RestrictionAttributeName,
    idPrefix,
    restriction
  },{
    id: idPrefix + '-required',
    component: RestrictionAttributeRequired,
    idPrefix,
    restriction
  },{
    id: idPrefix + '-minInclusive',
    component: RestrictionMinInclusive,
    idPrefix,
    restriction
  },{
    id: idPrefix + '-maxInclusive',
    component: RestrictionMaxInclusive,
    idPrefix,
    restriction
  },{
    id: idPrefix + '-enumeration',
    component: RestrictionEnumeration,
    idPrefix,
    restriction
  },{
    id: idPrefix + '-negate',
    component: RestrictionNegate,
    idPrefix,
    restriction
  } ];

  return entries;
}

function RestrictionId(props) {
  const {
    idPrefix,
    element,
    restriction
  } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: restriction,
      properties: {
        id: value
      }
    });
  };

  const getValue = () => {
    return restriction.id;
  };

  return TextFieldEntry({
    element: restriction,
    id: idPrefix + '-id',
    label: translate('Id'),
    getValue,
    setValue,
    debounce
  });
}

function RestrictionAttributeName(props) {
  const {
    idPrefix,
    element,
    restriction
  } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: restriction,
      properties: {
        attribute: value
      }
    });
  };

  const getValue = () => {
    return restriction.attribute;
  };

  return TextFieldEntry({
    element: restriction,
    id: idPrefix + '-attribute',
    label: translate('Attribute name'),
    getValue,
    setValue,
    debounce
  });
}

function RestrictionAttributeRequired(props) {
  const {
    idPrefix,
    element,
    restriction
  } = props;

  const modeling = useService('modeling');
  const commandStack = useService('commandStack');
  const translate = useService('translate');

  const setValue = (value) => {
      commandStack.execute(
        'element.updateModdleProperties',
        {
          element,
          moddleElement: restriction,
          properties: {
            required: value
          }
        }
      );
  };

  const getValue = (element) => {
    return restriction.get('required');
  };

  return CheckboxEntry({
    element,
    id: 'required',
    label: translate('Value is required'),
    getValue,
    setValue
  });
}

function RestrictionNegate(props) {
  const {
    idPrefix,
    element,
    restriction
  } = props;

  const modeling = useService('modeling');
  const commandStack = useService('commandStack');
  const translate = useService('translate');

  const setValue = (value) => {
      commandStack.execute(
        'element.updateModdleProperties',
        {
          element,
          moddleElement: restriction,
          properties: {
            negate: value
          }
        }
      );
  };

  const getValue = (element) => {
    return restriction.get('negate');
  };

  return CheckboxEntry({
    element,
    id: 'negate',
    label: translate('Negate restriction'),
    getValue,
    setValue
  });
}


function RestrictionMinInclusive(props) {
  const {
    idPrefix,
    element,
    restriction
  } = props;

  const commandStack = useService('commandStack');
  const bpmnFactory = useService('bpmnFactory');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    let commands = [];
    // delete prior minInclusive element
    let minInclusive = restriction.get('minInclusive');
    if ( minInclusive ) {
      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: restriction,
          properties: {
            minInclusive: without(restriction.get('minInclusive'), minInclusive)
          }
        }
      });
    }
    // add  minInclusive element
    minInclusive = createElement('execution:MinInclusive', { value }, status, bpmnFactory);

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: restriction,
      properties: {
        minInclusive: [ ...restriction.get('minInclusive'), minInclusive ]
      }
    });
  };

  const getValue = () => {
    if ( restriction && (restriction.get('minInclusive') || []).length > 0 ) {
      return restriction.get('minInclusive')[0].value;
    }
  };

  return TextFieldEntry({
    element: restriction,
    id: idPrefix + '-minInclusive',
    label: translate('Value must be larger or equal to'),
    getValue,
    setValue,
    debounce
  });
}

function RestrictionMaxInclusive(props) {
  const {
    idPrefix,
    element,
    restriction
  } = props;

  const commandStack = useService('commandStack');
  const bpmnFactory = useService('bpmnFactory');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    let commands = [];
    // delete prior maxInclusive element
    let maxInclusive = restriction.get('maxInclusive');
    if ( maxInclusive ) {
      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: restriction,
          properties: {
            maxInclusive: without(restriction.get('maxInclusive'), maxInclusive)
          }
        }
      });
    }
    // add  maxInclusive element
    maxInclusive = createElement('execution:MaxInclusive', { value }, status, bpmnFactory);

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: restriction,
      properties: {
        maxInclusive: [ ...restriction.get('maxInclusive'), maxInclusive ]
      }
    });
  };

  const getValue = () => {
    if ( restriction && (restriction.get('maxInclusive') || []).length > 0 ) {
      return restriction.get('maxInclusive')[0].value;
    }
  };

  return TextFieldEntry({
    element: restriction,
    id: idPrefix + '-maxInclusive',
    label: translate('Value must be smaller or equal to'),
    getValue,
    setValue,
    debounce
  });
}

function RestrictionEnumeration(props) {
  const {
    idPrefix,
    element,
    restriction
  } = props;

  const bpmnFactory = useService('bpmnFactory');
  const commandStack = useService('commandStack');
  const translate = useService('translate');

  const enumeration = restriction.get('enumeration');


  function addValue() {
    let commands = [];

    // create enumeration
    const enumeration = createElement('execution:Enumeration', {}, restriction, bpmnFactory);

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: restriction,
      properties: {
        enumeration: [ ...restriction.get('enumeration'), enumeration ]
      }
    });
  }

  function removeValue(enumeration) {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: restriction,
      properties: {
        enumeration: without(restriction.get('enumeration'), enumeration)
      }
    });
  }
/*
  function compareKey(content, anotherContent) {
    const [ key = '', anotherKey = '' ] = [ content.key, anotherContent.key ];

    return key === anotherKey ? 0 : key > anotherKey ? 1 : -1;
  }
*/
  return <ListEntry
    id={ idPrefix }
    element={ element }
    label={ translate('Allowed values') }
    items={ enumeration }
    component={ Enumeration }
    onAdd={ addValue }
    onRemove={ removeValue }
//    compareFn={ compareKey }
    autoFocusEntry
  />;
}

function Enumeration(props) {
  const {
    element,
    id: idPrefix,
    index,
    item: enumeration,
    open
  } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: enumeration,
      properties: {
        value: value
      }
    });
  };

  const getValue = () => {
    return enumeration.value;
  };

  return TextFieldEntry({
    element: enumeration,
    id: idPrefix + '-value',
    label: 'Value',//translate('Value'),
    getValue,
    setValue,
    debounce
  });

}




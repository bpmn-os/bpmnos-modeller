import {
  is,
  getBusinessObject
} from 'bpmn-js/lib/util/ModelUtil';

import { SelectEntry } from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';

import {
  createElement,
  nextId
} from '../utils/ElementUtil';

import {
  getCustomItem,
  ensureCustomItem
} from '../utils/CustomItemUtil';

/**
 * @returns {Array<Entry>} entries
 */
export function AdHocOrderingProps(props) {
  const {
    element
  } = props;

  if ( !is(element, 'bpmn:AdHocSubProcess' ) ) {
    return [];
  }

  return [
    {
      id: 'ordering',
      component: AdHocOrdering
    }
  ];
}

function AdHocOrdering(props) {
  const {
    element
  } = props;

  const modeling = useService('modeling');
  const translate = useService('translate');

  const setValue = (value) => {
    modeling.updateProperties(getBusinessObject(element), {
      ordering: value
    });
  };

  const getValue = () => {
    return getBusinessObject(element).ordering || 'Parallel';
  };

  const getOptions = (element) => {
    return [
      { value: 'Sequential', label: translate('Sequential') },
      { value: 'Parallel', label: translate('Parallel') }
    ];
  };

  return SelectEntry({
    id: 'ordering',
    label: translate('Ordering'),
    getValue,
    setValue,
    getOptions
  });
}


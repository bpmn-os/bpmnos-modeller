import {
  getBusinessObject,
  isAny
} from 'bpmn-js/lib/util/ModelUtil';

import SignalEntries from './SignalEntries';

import { TextFieldEntry } from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';

import {
  getCustomItem
} from '../utils/CustomItemUtil';

import {
  isSignalSupported
} from '../utils/EventDefinitionUtil';


/**
 * @returns {Array<Entry>} entries
 */
export function signalHandler({ element }) {

  if (!isSignalSupported(element) ) {
    return [];
  }

  const id = element.id + '-signal';
  let signal = getCustomItem( element, 'bpmnos:Signal' );
  return SignalEntries({
        idPrefix: id,
        element,
        signal
      });
}


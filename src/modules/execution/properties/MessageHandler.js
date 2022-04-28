import {
  getBusinessObject,
  isAny
} from 'bpmn-js/lib/util/ModelUtil';

import MessageEntries from './MessageEntries';

import { TextFieldEntry } from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';

import {
  getCustomItem
} from '../utils/CustomItemUtil';

import {
  isMessageSupported
} from '../utils/EventDefinitionUtil';


/**
 * @returns {Array<Entry>} entries
 */
export function messageHandler({ element }) {

  if (!isMessageSupported(element)) {
    return [];
  }

/*
  if ( !isAny(element, ['bpmn:CatchEvent', 'bpmn:ThrowEvent', 'bpmn:ReceiveTask', 'bpmn:SendTask'] ) ) {
    return [];
  }

  if ( isAny(element, ['bpmn:CatchEvent', 'bpmn:ThrowEvent'] ) && getBusinessObject(element).eventDefinitions[0].$type != "bpmn:MessageEventDefinition" ) {
    return [];
  }
*/
  const id = element.id + '-message';
  let message = getCustomItem( element, 'execution:Message' );
  return MessageEntries({
        idPrefix: id,
        element,
        message
      });
}


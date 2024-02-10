import DecisionTaskPopupMenu from './DecisionTaskPopupMenu';
import DecisionTaskDecorator from './DecisionTaskDecorator';
import BPMNOSPropertiesProvider from './BPMNOSPropertiesProvider';
import BPMNOSPropertiesUpdater from './BPMNOSPropertiesUpdater';
import ReplaceIds from './ReplaceIds';

export default {
  __init__: [ 'decisionTaskPopupMenu', 'decisionTaskDecorator', 'bpmnosPropertiesProvider', 'bpmnosPropertiesUpdater', 'replaceIds' ],
  decisionTaskPopupMenu: [ 'type', DecisionTaskPopupMenu ],
  decisionTaskDecorator: [ 'type', DecisionTaskDecorator ],
  bpmnosPropertiesProvider: [ 'type', BPMNOSPropertiesProvider ],
  bpmnosPropertiesUpdater: [ 'type', BPMNOSPropertiesUpdater ],
  replaceIds: [ 'type', ReplaceIds ]
};

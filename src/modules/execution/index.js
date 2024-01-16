import DecisionTaskPopupMenu from './DecisionTaskPopupMenu';
import DecisionTaskDecorator from './DecisionTaskDecorator';
import ExecutionPropertiesProvider from './ExecutionPropertiesProvider';
import ExecutionPropertiesUpdater from './ExecutionPropertiesUpdater';
import ReplaceIds from './ReplaceIds';

export default {
  __init__: [ 'decisionTaskPopupMenu', 'decisionTaskDecorator', 'executionPropertiesProvider', 'executionPropertiesUpdater', 'replaceIds' ],
  decisionTaskPopupMenu: [ 'type', DecisionTaskPopupMenu ],
  decisionTaskDecorator: [ 'type', DecisionTaskDecorator ],
  executionPropertiesProvider: [ 'type', ExecutionPropertiesProvider ],
  executionPropertiesUpdater: [ 'type', ExecutionPropertiesUpdater ],
  replaceIds: [ 'type', ReplaceIds ]
};

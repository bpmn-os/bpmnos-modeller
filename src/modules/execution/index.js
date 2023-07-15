import DecisionTaskPopupMenu from './DecisionTaskPopupMenu';
import DecisionTaskDecorator from './DecisionTaskDecorator';
import ExecutionPropertiesProvider from './ExecutionPropertiesProvider';
import ExecutionPropertiesUpdater from './ExecutionPropertiesUpdater';

export default {
  __init__: [ 'decisionTaskPopupMenu', 'decisionTaskDecorator', 'executionPropertiesProvider', 'executionPropertiesUpdater' ],
  decisionTaskPopupMenu: [ 'type', DecisionTaskPopupMenu ],
  decisionTaskDecorator: [ 'type', DecisionTaskDecorator ],
  executionPropertiesProvider: [ 'type', ExecutionPropertiesProvider ],
  executionPropertiesUpdater: [ 'type', ExecutionPropertiesUpdater ]
};

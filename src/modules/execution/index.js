import ExecutionPropertiesProvider from './ExecutionPropertiesProvider';
import ExecutionPropertiesUpdater from './ExecutionPropertiesUpdater';

export default {
  __init__: [ 'executionPropertiesProvider', 'executionPropertiesUpdater' ],
  executionPropertiesProvider: [ 'type', ExecutionPropertiesProvider ],
  executionPropertiesUpdater: [ 'type', ExecutionPropertiesUpdater ]
};

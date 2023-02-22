const unsupportedNode = require('./helper').unsupportedNode;

module.exports = unsupportedNode('Event subprocess ignored by execution engine','bpmn:SubProcess', 'triggeredByEvent', true);

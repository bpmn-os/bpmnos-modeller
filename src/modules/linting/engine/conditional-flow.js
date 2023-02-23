const unsupportedNode = require('./helper').unsupportedNode;

module.exports = unsupportedNode('Conditional flows not supported by execution engine','bpmn:SequenceFlow', 'conditionExpression');


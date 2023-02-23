const unsupportedNode = require('./helper').unsupportedNode;

module.exports = unsupportedNode('Compensation activities not supported by execution engine',['bpmn:SubProcess','bpmn:Activity'], 'isForCompensation');

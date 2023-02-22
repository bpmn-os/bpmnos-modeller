const unsupportedNode = require('./helper').unsupportedNode;

module.exports = unsupportedNode('Loop and multi-instance markers not supported by execution engine','bpmn:Activity', 'loopCharacteristics');

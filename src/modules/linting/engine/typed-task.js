const unsupportedNode = require('./helper').unsupportedNode;

module.exports = unsupportedNode('Typed tasks not supported by execution engine',['bpmn:ManualTask','bpmn:UserTask','bpmn:ServiceTask','bpmn:BusinessRuleTask','bpmn:ScriptTask','bpmn:ReceiveTask','bpmn:SendTask']);

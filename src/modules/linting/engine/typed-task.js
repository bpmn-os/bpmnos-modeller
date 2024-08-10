const unsupportedNode = require('./helper').unsupportedNode;

module.exports = unsupportedNode('Typed task ignored by execution engine',['bpmn:ManualTask','bpmn:UserTask','bpmn:ServiceTask','bpmn:BusinessRuleTask','bpmn:ScriptTask']);

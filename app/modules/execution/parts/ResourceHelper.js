'use strict';

var is = require('bpmn-js/lib/util/ModelUtil').is;

var ResourceHelper = {};

module.exports = ResourceHelper;

ResourceHelper.getResources = function() {
  var definitions = modeler.getDefinitions();
  return definitions.get('rootElements').filter(function(element) { return is(element, 'bpmn:Resource'); });
};

ResourceHelper.getResource = function( id ) {
  var definitions = modeler.getDefinitions();
  var resources = definitions.get('rootElements').filter(function(element) { return is(element, 'bpmn:Resource') && element.id == id; });
  return resources[0];
};



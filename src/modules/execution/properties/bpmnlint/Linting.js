import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import { useService } from 'bpmn-js-properties-panel';


/**
 * @typedef { import('@bpmn-io/properties-panel').EntryDefinition } Entry
 */

/**
 * @returns {Array<Entry>} entries
 */
export function Linting() {
  return [
    {
      id: 'lintingToggle',
      component: LintingToggle
    }
  ];
}

function LintingToggle() {
  const linting = useService('linting');
  const eventBus = useService('eventBus');
  const translate = useService('translate');

  const handleChange = e => {
    linting.toggle(e.target.checked);
  };

  const toggleSwitch = (
   <div class="bio-properties-panel-entry bio-properties-panel-toggle-switch-entry">
    <div class="bio-properties-panel-toggle-switch">
      <div class="bio-properties-panel-field-wrapper">
        <label class="bio-properties-panel-toggle-switch__switcher">
          <input
            id="lintingToggle"
            class="bio-properties-panel-input"
            type="checkbox" onChange={ handleChange }/>
          <span class="bio-properties-panel-toggle-switch__slider" />
        </label>
        <p class="bio-properties-panel-toggle-switch__label">{ translate('Use model checker') }</p>
      </div>
    </div>
   </div>
  );

  eventBus.on('linting.toggle', function(event) {
    const lintingToggle = document.getElementById("lintingToggle");
    lintingToggle.checked = event.active;
  });

  eventBus.on('linting.completed', function(event) {
console.log("Issues:",event.issues);
  });

  return toggleSwitch;
}



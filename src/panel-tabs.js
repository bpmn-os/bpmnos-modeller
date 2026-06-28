// Lightweight tab controller for the right-hand panel (#rightbox).
// Switches between the per-element "Properties" pane and the global "Model checker" pane.
// Kept in the modeller's own DOM (not the properties-panel) so global views are decoupled
// from the properties-panel internals and stay stable across element selection.
export default function createPanelTabs() {
  const tabs = Array.from(document.querySelectorAll('#panel-tabs .panel-tab'));
  const panes = Array.from(document.querySelectorAll('#rightbox .panel-pane'));

  function activate(name) {
    tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === name));
    panes.forEach(p => p.classList.toggle('active', p.id === 'pane-' + name));
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => activate(tab.getAttribute('data-tab')));
  });
}

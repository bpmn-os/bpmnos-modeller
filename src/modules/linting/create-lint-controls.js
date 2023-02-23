export default function(modeler) {
  const linting = modeler.get('linting');
  const eventBus = modeler.get('eventBus');
  const elementRegistry = modeler.get('elementRegistry');
  const selectionService = modeler.get('selection');
  const canvas = modeler.get('canvas');
  const contextPad = modeler.get('contextPad');

  const parent = document.getElementById("global-controls");
  parent.innerHTML += 
         `<div class="bio-properties-panel">
            <div class="bio-properties-panel-entry bio-properties-panel-toggle-switch-entry">
               <div class="bio-properties-panel-toggle-switch">
                  <div class="bio-properties-panel-field-wrapper">
                     <label class="bio-properties-panel-toggle-switch__switcher">
                       <input id="lintingToggle" class="bio-properties-panel-input" type="checkbox">
                       <span class="bio-properties-panel-toggle-switch__slider"></span>
                     </label>
                     <p class="bio-properties-panel-toggle-switch__label">Use model checker</p>
                  </div>
               </div>
            </div>
            <div id="issueList"></div>
         </div>`;
  const toggle = parent.querySelector('input');

  toggle.addEventListener('change',function(event) {
    linting.toggle(event.target.checked);
  });

  eventBus.on('linting.toggle', function(event) {
    const lintingToggle = document.getElementById("lintingToggle");
    if ( lintingToggle ) {
      lintingToggle.checked = event.active;
    }
  });

  const error = '<span class="icon error"> <svg width="12" height="12" version="1.1" viewBox="0 0 352 512" xmlns="http://www.w3.org/2000/svg" style="margin: auto;text-align: center;"><path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z" fill="currentColor"></path></svg></span>&nbsp;';

  const warning = '<span class="icon warning"> <svg width="12" height="12" version="1.1" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" style="margin: auto;text-align: center;">  <path d="m256 323.95c-45.518 0-82.419 34.576-82.419 77.229 0 42.652 36.9 77.229 82.419 77.229 45.518 0 82.419-34.577 82.419-77.23 0-42.652-36.9-77.229-82.419-77.229zm-80.561-271.8 11.61 204.35c.544 9.334 8.78 16.64 18.755 16.64h100.39c9.975 0 18.211-7.306 18.754-16.64l11.611-204.35c.587-10.082-7.98-18.56-18.754-18.56h-123.62c-10.775 0-19.34 8.478-18.753 18.56z" fill="currentColor"></path></svg></span>&nbsp;';

  eventBus.on('linting.toggle', function(event) {
    if ( !event.active ) {
      const issueList = document.getElementById("issueList");
      if ( issueList ) {
        issueList.innerHTML = "";
      }
    }
  });

  eventBus.on('linting.completed', function(event) {
    const issueList = document.getElementById("issueList");
    if ( issueList ) {
      let html = '';
      for (var id in event.issues) {
        html += html = '<div class="bjsl-issues" data-id="' + id + '"><div class="bjsl-current-element-issues"><div style="font-weight:bold;">' + id + '</div><ul>';
        for (var i = 0; i < event.issues[id].length; i++) {
          html += '<li class="' + event.issues[id][i].category + '">' + (event.issues[id][i].category == 'error' ? error : warning) + event.issues[id][i].message + '</li>';
        }
        html += '</ul></div></div></div>';
      }
      issueList.innerHTML = html;
      for (var i = 0; i < issueList.children.length; i++) {
        issueList.children[i].addEventListener ("click", function() {
          const element = elementRegistry.get(this.getAttribute("data-id"));
          canvas.setRootElement(canvas.findRoot(element));
          selectionService.select(element);
          if (element.type == 'bpmn:Process') {
            contextPad.close(element);
          }
        });
      }
    }
  });

}

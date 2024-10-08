import ResourceRenderer from './ResourceRenderer';
import ResourceLabelProvider from './ResourceLabelProvider';
import ResourceContextPad from './ResourceContextPad';
import ResourcePalette from './ResourcePalette';
import ResourceElementsPopupMenu from './ResourceElementsPopupMenu';
import RequestFactory from './RequestFactory';
import ReleaseFactory from './ReleaseFactory';
import ResourceFactory from './ResourceFactory';
import PreventEditing from './PreventEditing';

export default {
  __init__: [ 'resourceRenderer', 'resourceLabelProvider', 'resourceContextPad', 'resourcePalette', 'resourceElementsPopupMenu', 'requestFactory', 'releaseFactory', 'resourceFactory', 'preventEditing' ],
  resourceRenderer: [ 'type', ResourceRenderer ],
  resourceLabelProvider: [ 'type', ResourceLabelProvider ],
  resourceContextPad: [ 'type', ResourceContextPad ],
  resourcePalette: [ 'type', ResourcePalette ],
  resourceElementsPopupMenu: [ 'type', ResourceElementsPopupMenu ],
  requestFactory: [ 'type', RequestFactory ],
  releaseFactory: [ 'type', ReleaseFactory ],
  resourceFactory: [ 'type', ResourceFactory ],
  preventEditing: [ 'type', PreventEditing ]
};

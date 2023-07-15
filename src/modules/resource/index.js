import ResourceRenderer from './ResourceRenderer';
import ResourceLabelProvider from './ResourceLabelProvider';
import ResourceContextPad from './ResourceContextPad';
import ResourcePalette from './ResourcePalette';
import ResourceUpdater from './ResourceUpdater';
import JobDecorator from './JobDecorator';
import JobPopupMenu from './JobPopupMenu';

export default {
  __init__: [ 'resourceRenderer', 'resourceLabelProvider', 'resourceContextPad', 'resourcePalette', 'resourceUpdater', 'jobDecorator', 'jobPopupMenu' ],
  resourceRenderer: [ 'type', ResourceRenderer ],
  resourceLabelProvider: [ 'type', ResourceLabelProvider ],
  resourceContextPad: [ 'type', ResourceContextPad ],
  resourcePalette: [ 'type', ResourcePalette ],
  resourceUpdater: [ 'type', ResourceUpdater ],
  jobDecorator: [ 'type', JobDecorator ],
  jobPopupMenu: [ 'type', JobPopupMenu ]
};

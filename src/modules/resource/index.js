import ResourceRenderer from './ResourceRenderer';
import ResourceLabelProvider from './ResourceLabelProvider';
import ResourceContextPad from './ResourceContextPad';
import ResourcePalette from './ResourcePalette';
import ResourceUpdater from './ResourceUpdater';
import JobRenderer from './JobRenderer';

export default {
  __init__: [ 'resourceRenderer', 'resourceLabelProvider', 'resourceContextPad', 'resourcePalette', 'resourceUpdater', 'jobRenderer' ],
  resourceRenderer: [ 'type', ResourceRenderer ],
  resourceLabelProvider: [ 'type', ResourceLabelProvider ],
  resourceContextPad: [ 'type', ResourceContextPad ],
  resourcePalette: [ 'type', ResourcePalette ],
  resourceUpdater: [ 'type', ResourceUpdater ],
  jobRenderer: [ 'type', JobRenderer ]
};

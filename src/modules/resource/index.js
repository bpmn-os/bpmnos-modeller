import ResourceRenderer from './ResourceRenderer';
import ResourceContextPad from './ResourceContextPad';
import ResourcePalette from './ResourcePalette';
import ResourceUpdater from './ResourceUpdater';
import JobRenderer from './JobRenderer';

export default {
  __init__: [ 'resourceRenderer', 'resourceContextPad', 'resourcePalette', 'resourceUpdater', 'jobRenderer' ],
  resourceRenderer: [ 'type', ResourceRenderer ],
  resourceContextPad: [ 'type', ResourceContextPad ],
  resourcePalette: [ 'type', ResourcePalette ],
  resourceUpdater: [ 'type', ResourceUpdater ],
  jobRenderer: [ 'type', JobRenderer ]
};

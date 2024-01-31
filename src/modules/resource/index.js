import ResourceRenderer from './ResourceRenderer';
import ResourceLabelProvider from './ResourceLabelProvider';
import ResourceContextPad from './ResourceContextPad';
import ResourcePalette from './ResourcePalette';
import ResourceElementsPopupMenu from './ResourceElementsPopupMenu';
import RequestFactory from './RequestFactory';
import ReleaseFactory from './ReleaseFactory';
import ResourceFactory from './ResourceFactory';
import PreventEditing from './PreventEditing';
import SequencerDecorator from './SequencerDecorator';
import JobDecorator from './JobDecorator';
import JobPopupMenu from './JobPopupMenu';

export default {
  __init__: [ 'resourceRenderer', 'resourceLabelProvider', 'resourceContextPad', 'resourcePalette', 'resourceElementsPopupMenu', 'requestFactory', 'releaseFactory', 'resourceFactory', 'preventEditing', 'sequencerDecorator', 'jobDecorator', 'jobPopupMenu' ],
  resourceRenderer: [ 'type', ResourceRenderer ],
  resourceLabelProvider: [ 'type', ResourceLabelProvider ],
  resourceContextPad: [ 'type', ResourceContextPad ],
  resourcePalette: [ 'type', ResourcePalette ],
  resourceElementsPopupMenu: [ 'type', ResourceElementsPopupMenu ],
  requestFactory: [ 'type', RequestFactory ],
  releaseFactory: [ 'type', ReleaseFactory ],
  resourceFactory: [ 'type', ResourceFactory ],
  preventEditing: [ 'type', PreventEditing ],
  sequencerDecorator: [ 'type', SequencerDecorator ],
  jobDecorator: [ 'type', JobDecorator ],
  jobPopupMenu: [ 'type', JobPopupMenu ]
};

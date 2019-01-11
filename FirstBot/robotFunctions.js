import {Queue} from './Queue.js';
import {Location} from './Location.js';
import * as utilities from './utilities.js'
import * as navigation from './navigation.js'

export function rememberBuildableOffsets(state) {
  state.buildableOffsets = navigation.getMovableOffsets(new Location(state.me.y, state.me.x), navigation.getOffsetsInRange(2), state.map);
}

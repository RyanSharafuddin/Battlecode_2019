import {SPECS} from 'battlecode';
import {Queue} from './Queue.js';
import {Location} from './Location.js';
import * as utilities from './utilities.js'
import * as navigation from './navigation.js'
import * as robotFunctions from './robotFunctions.js'
import * as attacker from './attacker.js'
import * as CONSTANTS from './universalConstants.js'



export function castleTurn(state) {
  if(state.mode == CONSTANTS.MODE.SPAWN) {
    for (var i = 0; i < state.spawn_list.length; i++) {
      var offset = state.spawn_list[i];
      if (navigation.idAtOffset(offset, state) == 0) {
        //state.log("Building rush unit @ offset: " + JSON.stringify(offset));
        return state.buildUnit(CONSTANTS.RUSH_BOT, offset[1], offset[0]);
      }
    }
    //state.log("All offsets in spawn_list are occupied");
    return null; //all adjacent occupied
  }
  if(state.mode == CONSTANTS.MODE.DO_NOTHING) {
    //state.log("In do nothing mode, so doing nothing.");
    return null;
  }
}

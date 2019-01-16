import {SPECS} from 'battlecode';
import {Queue} from './Queue.js';
import {Location} from './Location.js';
import * as utilities from './utilities.js'
import * as navigation from './navigation.js'
import * as robotFunctions from './robotFunctions.js'
import * as attacker from './attacker.js'
import * as CONSTANTS from './universalConstants.js'


export function castleInitialize(state) {
  if(state.me.turn == 1) {
    robotFunctions.rememberBuildableOffsets(state);
    robotFunctions.rememberStartingConnectedComponents(state, state.buildableOffsets); //TODO remove if buggy
    state.correspondingEnemyCastleLoc = navigation.reflectLocation(new Location(state.me.y, state.me.x), state.map.length, state.symmetryType);
    if(state.correspondingEnemyCastleLoc == null) {
      state.mode = CONSTANTS.MODE.DO_NOTHING;
      return null;
    }

    var attackingLocations = attacker.attackableFrom(state.correspondingEnemyCastleLoc, CONSTANTS.RUSH_BOT, state.map);

    var offsetToUse = [state.startingConnectedComponents[0][0][0], state.startingConnectedComponents[0][0][1]];
    var beginLoc = state.myLoc.addOffset(offsetToUse);
    state.firstCCshortestPathTree = navigation.makeShortestPathTree(beginLoc, SPECS.UNITS[CONSTANTS.RUSH_BOT].SPEED, state.map, {state: state});

    if(state.startingConnectedComponents[1].length !== 0) {
      var offsetToUse = [state.startingConnectedComponents[1][0][0], state.startingConnectedComponents[1][0][1]];
      var beginLoc = state.myLoc.addOffset(offsetToUse);
      state.secondCCshortestPathTree = navigation.makeShortestPathTree(beginLoc, SPECS.UNITS[CONSTANTS.RUSH_BOT].SPEED, state.map);
      secondCCListofLocsByCloseness = navigation.getLocsByCloseness(state.secondCCshortestPathTree, attackingLocations);
    }
    var firstCCListofLocsByCloseness = navigation.getLocsByCloseness(state.firstCCshortestPathTree, attackingLocations);
    var secondCCListofLocsByCloseness = (state.startingConnectedComponents[1].length !== 0) ? navigation.getLocsByCloseness(state.secondCCshortestPathTree, attackingLocations) : null;
    if((secondCCListofLocsByCloseness == null) || (secondCCListofLocsByCloseness[0][1] == Number.POSITIVE_INFINITY)) {
      if(firstCCListofLocsByCloseness[0][1] != Number.POSITIVE_INFINITY) {
        state.mode = CONSTANTS.MODE.SPAWN;
        state.spawn_list = state.startingConnectedComponents[0];
      }
      else {
        state.mode = CONSTANTS.MODE.DO_NOTHING;
      }
    }
    else {
      if(firstCCListofLocsByCloseness[0][1] == Number.POSITIVE_INFINITY) {
        state.mode = CONSTANTS.MODE.SPAWN;
        state.spawn_list = state.startingConnectedComponents[1];
      }
      else {
        state.mode = CONSTANTS.MODE.SPAWN;
        state.spawn_list = (firstCCListofLocsByCloseness[0][1] < secondCCListofLocsByCloseness[0][1]) ? state.startingConnectedComponents[0] : state.startingConnectedComponents[1];
      }
    }
  }
}

import {SPECS} from 'battlecode';
import {Queue} from './Queue.js';
import {Location} from './Location.js';
import * as utilities from './utilities.js'
import * as navigation from './navigation.js'
import * as robotFunctions from './robotFunctions.js'
import * as attacker from './attacker.js'
import * as castle from './castle.js'
import * as CONSTANTS from './universalConstants.js'

export function crusaderInitialize(state) {
  //calls rememberSpawnInfo and sets up stuff for the mode system
  if(state.me.turn == 1) {
    var costs = navigation.makeShortestPathTree(state.myLoc, SPECS.UNITS[state.me.unit].SPEED, state.map);
    robotFunctions.rememberSpawnInfo(state, {costs: costs});
    //state.log("Crusader turn 1, state.myLoc: " + JSON.stringify(state.myLoc) + " state.spawnedLoc is: " + JSON.stringify(state.spawnedLoc));
    //state.log("Target Castle is attackable from: " + JSON.stringify(state.targetCastleAttackableFrom));
    if((!state.targetSquaresByCloseness) || (state.targetSquaresByCloseness[0][1] == Number.POSITIVE_INFINITY)) {
      //cannot reach a position from which to attack enemy castle, or not spawned from a castle to begin with
      state.mode = CONSTANTS.MODE.PATROL;
    }
    else {
      //TODO mode switching function here
      state.mode = CONSTANTS.MODE.GO_TO_TARGET;
      state.currentTargetIndex = 0;
      state.pathToTarget = navigation.getPathTo(costs, state.myLoc, state.targetList[state.currentTargetIndex], state);
      state.numMoveToMake = 0;
      //state.log("targetList, now sorted by closeness is: " + utilities.pretty(state.targetList));
      //state.log("pathToTarget is: " + utilities.pretty(state.pathToTarget));
      if(state.pathToTarget == null) {
        state.log("ERROR ERROR ERROR");
      }
    }
  }
}

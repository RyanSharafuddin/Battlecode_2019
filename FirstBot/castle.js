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
    var secondCC = (state.karbLocsTwo.length != 0);
    var numMines = 0;
    const TCOST = 550; //highest tolerable number of moves to mine.
    var whichCC = [];
    var klo = state.karbLocsOne;
    var klt = state.karbLocsTwo;
    for(;  ((numMines < klo.length) && (klo[numMines][1] <= TCOST))  || (secondCC && (numMines < klt.length) && (klt[numMines][1] <= TCOST)); numMines++) {
      if (state.karbLocsOne[numMines][1] <= TCOST) {
        whichCC.push(0);
      }
      else {
        whichCC.push(1);
      }
    }
    state.currentModeInfo = {
                              reason: CONSTANTS.REASON.NEARBY_MINES,
                              numPilgrims: numMines,
                              mineNum: 0,
                              mineType: "karbonite",
                              whichCC: whichCC,
                              nextMode: -1,
                              modeVal: CONSTANTS.MODE.SPAWN_PILGRIMS
                            };
    state.modesList = [state.currentModeInfo];
    state.modeIndex = 0;
  }
}
export function castleTurn(state) {
  learnLocs(state);
  switch(state.currentModeInfo.modeVal) {
    case CONSTANTS.MODE.SPAWN_PILGRIMS:
      state.log("In spawn pilgrim mode");
      return modePilgrimSpawn(state);
    break;
  }
}

function modePilgrimSpawn(state) {
  if(state.unoccupiedBuildableOffsets.length > 0) {

    if(state.currentModeInfo.numPilgrims <= 0) {
      return; //TODO switch modes here
    }
    state.currentModeInfo.numPilgrims--;
    switch (state.currentModeInfo.reason) {
      case CONSTANTS.REASON.NEARBY_MINES:
        var karbListToUse = (state.currentModeInfo.whichCC[state.currentModeInfo.mineNum] == 0) ? state.karbLocsOne : state.karbLocsTwo;
        var fuelListToUse = (state.currentModeInfo.whichCC[state.currentModeInfo.mineNum] == 0) ? state.fuelLocsOne : state.fuelLocsTwo;
        var mineLoc = (state.currentModeInfo.mineType == "karbonite") ? karbListToUse[state.currentModeInfo.mineNum][0] : fuelListToUse[state.currentModeInfo.mineNum][0];

        var offsetListToUse = state.startingConnectedComponents[state.currentModeInfo.whichCC[state.currentModeInfo.mineNum]];
        state.currentModeInfo.mineNum++;
        for (var i = 0; i < offsetListToUse.length; i++) {
          if(navigation.isOffsetUnoccupied(offsetListToUse[i], state)) {
            state.signal((mineLoc.y << 6 | mineLoc.x) , 2);
            return(state.buildUnit(SPECS.PILGRIM, offsetListToUse[i][1], offsetListToUse[i][0]));
          }
        }
        break;

      default:
        return(state.buildUnit(SPECS.PILGRIM, state.unoccupiedBuildableOffsets[0][1], state.unoccupiedBuildableOffsets[0][0]));
    }

  }
  state.log("In mode: SPAWN_PILGRIMS, but all adjacent squares are occupied");
}

function learnLocs(state) {
  // state.log("castleTalkingRobots: " + utilities.pretty(state.castleTalkingRobots));
  if(state.me.turn == 1) {
    state.castleTalk(state.myLoc.y);
    if(state.castleTalkingRobots.length == 0) {
      state.log("I am the first castle");
    }
    for(var i = 0; i < state.castleTalkingRobots.length; i++) {
      var bot = state.castleTalkingRobots[i];
      state.myCastles.push(new Location(bot.castle_talk, -1));
      state.robotCache.add({id: bot.id, unit: SPECS.CASTLE, team: state.me.team, castleIndex: state.myCastles.length -1});
      // state.log("Am adding id: " + bot.id + " for the first time.");
      // state.log("my castles: " + utilities.pretty(state.myCastles));
    }
  }

  if(state.me.turn == 2) {
    state.castleTalk(state.myLoc.x);
    if(state.castleTalkingRobots.length == 0) {
      state.log("I am the only castle");
    }
    for(var i = 0; i < state.castleTalkingRobots.length; i++) {
      var bot = state.castleTalkingRobots[i];
      if(state.robotCache.contains(bot.id)) { //seen this before, add its x coord
        var idx = state.robotCache.get(bot.id).castleIndex;
        state.myCastles[idx].x = bot.castle_talk;
        // state.log("Am updating id: " + bot.id);
        // state.log("my castles: " + utilities.pretty(state.myCastles));
      }
      else {
        state.myCastles.push(new Location(bot.castle_talk, -1));
        state.robotCache.add({id: bot.id, unit: SPECS.CASTLE, team: state.me.team, castleIndex: state.myCastles.length -1});
      //   state.log("Am adding id: " + bot.id + " for the first time.");
      // state.log("my castles: " + utilities.pretty(state.myCastles));
      }
    }
  }
  if(state.me.turn == 3) {
    for(var i = 0; i < state.castleTalkingRobots.length; i++) {
      var bot = state.castleTalkingRobots[i];
      state.myCastles[state.robotCache.get(bot.id).castleIndex].x = bot.castle_talk;
      // state.log("Am updating id: " + bot.id);
      // state.log("my castles: " + utilities.pretty(state.myCastles));
    }
    if(state.symmetryType != navigation.SymmetryEnum.INDETERMINATE) {
      for(var i = 1; i < state.myCastles.length; i++) {
        state.enemyCastles.push(navigation.reflectLocation(state.myCastles[i], state.map.length, state.symmetryType));
      }
    }
    // state.log("I now know the locations of all my own castles. They are: " + utilities.pretty(state.myCastles));
    // state.log("Enemy castles: " + utilities.pretty(state.enemyCastles));
  }
}

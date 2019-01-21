import {SPECS} from 'battlecode';
import {Queue} from './Queue.js';
import {Location} from './Location.js';
import * as utilities from './utilities.js'
import * as navigation from './navigation.js'
import * as robotFunctions from './robotFunctions.js'
import * as attacker from './attacker.js'
import * as CONSTANTS from './universalConstants.js'

const TCOST = 3;
export function castleInitialize(state) {
  if(state.me.turn == 1) {
    state.modesList = [];
    setModeDefend(state);
    takeNearestMines(state, TCOST, Number.POSITIVE_INFINITY, "karbonite");
  }
}

export function castleTurn(state) {
  learnLocs(state);
  switch(state.currentModeInfo.modeVal) {
    case CONSTANTS.MODE.SPAWN:
      // state.log("In spawn mode");
      // state.log(utilities.pretty(state.currentModeInfo));
      var retVal = spawnTurn(state);
      return((retVal == "LOW_RESOURCES" || retVal == "NO_ROOM") ? null : retVal);
      break;

    case CONSTANTS.MODE.DEFEND:
      state.log("In defend mode: "); //TODO implement
      // var karb = nearestMines(state, TCOST, Number.POSITIVE_INFINITY, "karbonite").locations.length;
      // var fuel = nearestMines(state, TCOST, Number.POSITIVE_INFINITY, "fuel").locations.length;
      // if(state.visibleFriends.length < karb + fuel) { //WARNING get rid of this after you test it.
      //   takeNearestMines(state, TCOST, Number.POSITIVE_INFINITY, "fuel");
      //   return castleTurn(state);
      // }
      return null;
      break;

  }
}

function nearestMines(state, cost, number, mineType) {
  //returns {locations: [] list of locs whichCCList: [] } of nearest NUMBER of mins of type MINETYPE that cost less than COST
  var whichCCList = [];
  var locations = [];

  var secondCC = (state.karbLocsTwo.length != 0);
  var klo = (mineType == "karbonite") ? state.karbLocsOne : state.fuelLocsOne;
  var klt =  (mineType == "karbonite") ? state.karbLocsTwo : state.fuelLocsTwo;
  for(var mineIndex = 0;
    (((mineIndex < klo.length) && (klo[mineIndex][1] <= cost))  ||
    (secondCC && (mineIndex < klt.length) && (klt[mineIndex][1] <= cost))) &&
  (mineIndex < number);
     mineIndex++)                                         {

          if (klo[mineIndex][1] <= cost) {
            whichCCList.push(0);
            locations.push(klo[mineIndex][0]);
          }
          else {
            whichCCList.push(1);
            locations.push(klt[mineIndex][0]);
          }
  }
  return ({locations: locations, whichCCList: whichCCList});
}

function takeNearestMines(state, cost, number, mineType) {
  var minesObj = nearestMines(state, cost, number, mineType);
  // state.log("Called takeNearestMines; here's the minesObj: " + utilities.pretty(minesObj));
  var unitsToSpawn = new Array(minesObj.locations.length).fill(SPECS.PILGRIM);
  var signalList = [];
  var whichCCList = [];
  for(var i = 0; i < minesObj.locations.length; i++) {
    var mineLoc = minesObj.locations[i];
    signalList.push([(mineLoc.y << 6 | mineLoc.x), 2]);
    whichCCList.push(minesObj.whichCCList[i]);
  }
  var nextMode = state.modeIndex;
  setSpawnMode(state, unitsToSpawn, signalList, whichCCList, nextMode);
}

function setSpawnMode(state, unitsToSpawn, signalList, whichCCList, nextMode) {
  var modeInfo = {
    unitsToSpawn: unitsToSpawn,
    unitIndex: 0,
    signalList: signalList,
    whichCCList: whichCCList,
    modeVal: CONSTANTS.MODE.SPAWN,
    nextMode: nextMode
  };
  state.currentModeInfo = modeInfo;
  state.modesList.push(modeInfo);
  state.modeIndex = state.modesList.length - 1;
}

function spawnTurn(state) {
  var mi = state.currentModeInfo;
  var unitToBuild = mi.unitsToSpawn[mi.unitIndex];
  var signal = mi.signalList[mi.unitIndex][0];
  var signalRadius = mi.signalList[mi.unitIndex][1];
  var lowKarb = SPECS.UNITS[unitToBuild].CONSTRUCTION_KARBONITE > state.karbonite;
  var lowFuel = SPECS.UNITS[unitToBuild].CONSTRUCTION_FUEL + 2 > state.fuel
  if(lowKarb || lowFuel) {
    state.log("TOO FEW RESOURCES TO BUILD UNIT");
    return "LOW_RESOURCES";
  }
  var offsetListToUse = (mi.whichCCList[mi.unitIndex]) ? state.secondUnoccupiedBuild : state.firstUnoccupiedBuild;
  if(offsetListToUse.length == 0) {
    state.log("No room to build");
    return "NO_ROOM";
  }
  mi.unitIndex++;
  if(mi.unitIndex == mi.unitsToSpawn.length) {
    //switch back to previous mode.
    state.currentModeInfo = state.modesList[mi.nextMode];
    state.modeIndex = mi.nextMode;
    state.modesList.pop();
  }
  state.signal(signal, signalRadius);
  return state.buildUnit(unitToBuild, offsetListToUse[0][1], offsetListToUse[0][0]);
}

function setModeDefend(state) {
  //TODO: implement
  var modeInfo = {modeVal: CONSTANTS.MODE.DEFEND};
  state.modesList.push(modeInfo);
  state.modeIndex = state.modesList.length - 1;
  state.currentModeInfo = modeInfo;
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

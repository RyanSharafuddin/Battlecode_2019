import {SPECS} from 'battlecode';
import {Queue} from './Queue.js';
import {Location} from './Location.js';
import * as utilities from './utilities.js'
import * as navigation from './navigation.js'
import * as robotFunctions from './robotFunctions.js'
import * as attacker from './attacker.js'
import * as CONSTANTS from './universalConstants.js'

export function pilgrimInitialize(state) {
  if(state.me.turn == 1) {
    var costs = navigation.makeShortestPathTree(state.myLoc, SPECS.UNITS[SPECS.PILGRIM].SPEED, state.map);
    state.karbLocs = navigation.getLocsByCloseness(costs, state.karbLocs);
    state.fuelLocs = navigation.getLocsByCloseness(costs, state.fuelLocs);
    state.modesList = [];
    for(var i = 0; i < state.radioingRobots.length; i++) {
      var r = state.radioingRobots[i];
      if( ((r.unit == SPECS.CASTLE) || (r.unit == SPECS.CHURCH)) && (r.team == state.me.team)) {
        if( (r.signal & (0xF << 12)) == 0) { //opcode 0000 yyyyyy xxxxxx
          var yCoord = (r.signal >>> 6) & 0b111111;
          var xCoord = (r.signal & 0b111111);
          setModeMine(state, new Location(r.y, r.x), new Location(yCoord, xCoord));
        }
      }
    }

  }
  //every turn
}

export function pilgrimTurn(state) {
  switch(state.modeVal) {
    case CONSTANTS.MODE.MINE:
      /*
        on mine and under capacity -> mine                             DONE
        on mine and at capacity -> go to square adjacent to depositLoc
        adjacent to deposit loc and at capacity -> give
        adjacent to deposit loc and at 0 -> go to mine
       */
      state.log("In mine mode. Mode info: " + utilities.pretty(state.currentModeInfo));
      var mineType = (state.karbonite_map[state.currentModeInfo.mineLoc.y][state.currentModeInfo.mineLoc.x]) ? "karbonite" : "fuel";
      var atCapacity = (mineType == "karbonite") ? (state.me.karbonite == SPECS.UNITS[SPECS.PILGRIM].KARBONITE_CAPACITY) : (state.me.fuel == SPECS.UNITS[SPECS.PILGRIM].FUEL_CAPACITY);
      var nextToDeposit = (navigation.radiusBetween(state.myLoc, state.currentModeInfo.depositLoc) <= 2);
      var onMine = state.myLoc.equals(state.currentModeInfo.mineLoc);

      if(nextToDeposit && atCapacity) {
        return state.give(state.depositLoc.x - state.myLoc.x, state.depositLoc.y - state.myLoc.y, state.me.karbonite, state.me.fuel);
      }
      if(onMine && !atCapacity) {
        return state.mine();
      }

      if(nextToDeposit && !atCapacity) {
        //go to mine (not on mine because if were, see above)
      }
      if(onMine && atCapacity) {
        //go to deposit (not at deposit b/c if were, see above)
      }
      break;
  }
}

function setModeMine(state, depositLoc, mineLoc) {
  var modeInfo = {
    depositLoc: depositLoc,
    mineLoc: mineLoc
  };
  state.modesList.push(modeInfo);
  state.currentModeInfo = modeInfo;
  state.modeIndex = state.modesList.length - 1;
  state.modeVal = CONSTANTS.MODE.MINE;
}

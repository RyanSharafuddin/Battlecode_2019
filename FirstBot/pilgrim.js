import {SPECS} from 'battlecode';
import {Queue} from './Queue.js';
import {Location} from './Location.js';
import * as utilities from './utilities.js'
import * as navigation from './navigation.js'
import * as robotFunctions from './robotFunctions.js'
import * as attacker from './attacker.js'
import * as CONSTANTS from './universalConstants.js'

export function pilgrimInitialize(state) {
  var costs = navigation.makeShortestPathTree(state.myLoc, SPECS.UNITS[SPECS.PILGRIM].SPEED, state.map);
  state.karbLocs = navigation.getLocsByCloseness(costs, state.karbLocs);
  state.fuelLocs = navigation.getLocsByCloseness(costs, state.fuelLocs);
}

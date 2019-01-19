import {BCAbstractRobot, SPECS} from 'battlecode';
import {Queue} from './Queue.js';
import {Location} from './Location.js';
import * as utilities from './utilities.js'
import * as navigation from './navigation.js'
//import * as robotFunctions from './robotFunctions.js' robotFunctions depends on this
import * as CONSTANTS from './universalConstants.js'

export function attackableFrom(locToAttack, unit, map) {
  var attackingOffsets = navigation.getMovableOffsets(locToAttack, navigation.getOffsetsInRange(SPECS.UNITS[unit].ATTACK_RADIUS[1]), map);
  //attackingOffsets are all offsets from locToAttack that are within maximum range
  var attackingLocations = [];
  attackingOffsets.forEach(function(attackingOffset) {
    if((attackingOffset[0]**2 + attackingOffset[1]**2) >= SPECS.UNITS[unit].ATTACK_RADIUS[0]) { //if above minimum range
      attackingLocations.push(new Location(locToAttack.y + attackingOffset[0], locToAttack.x + attackingOffset[1]));
    }
  });
  return attackingLocations;
}

export function isOffsetInAttackingRange(offset, unit) {
  if(SPECS.UNITS[unit].ATTACK_RADIUS == null) {
    return false;
  }
  return( (offset[0]**2 + offset[1]**2 <= SPECS.UNITS[unit].ATTACK_RADIUS[1]) &&
  (offset[0]**2 + offset[1]**2 >= SPECS.UNITS[unit].ATTACK_RADIUS[0]) );
}

export function getAttackableRobots(state) {
  //TODO: debug this and below function
  var attackableRobots = [];
  var accessibleRobots = state.getVisibleRobots();
  for(var i = 0; i < accessibleRobots.length; i++) {
    var accessibleRobot = accessibleRobots[i];
    if(state.isVisible(accessibleRobot) && (accessibleRobot.team != state.me.team) &&
        isOffsetInAttackingRange([accessibleRobot.y - state.me.y, accessibleRobot.x - state.me.x], state.me.unit)) {
        attackableRobots.push(accessibleRobot);
    }
  }
  return attackableRobots;
}

export function getAttackablePrioritizedByUnit(state) {
  var attackableRobots = getAttackableRobots(state);
  //sorts list of attackable units according to priority units (changes list)
  //TODO consider how to priortize attackable list
  var PRIORITY_LIST = [];
  PRIORITY_LIST[SPECS.CASTLE] = 0; //highest priority to attack
  PRIORITY_LIST[SPECS.CHURCH] = 1;
  PRIORITY_LIST[SPECS.PREACHER] = 2;
  PRIORITY_LIST[SPECS.PROPHET] = 3;
  PRIORITY_LIST[SPECS.CRUSADER] = 4;
  PRIORITY_LIST[SPECS.PILGRIM] = 5;
  attackableRobots.sort(function(a, b) {
    return PRIORITY_LIST[a.unit] - PRIORITY_LIST[b.unit]
  });
  return attackableRobots;
}

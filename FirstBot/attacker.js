import {BCAbstractRobot, SPECS} from 'battlecode';
import {Queue} from './Queue.js';
import {Location} from './Location.js';
import * as utilities from './utilities.js'
import * as navigation from './navigation.js'
import * as robotFunctions from './robotFunctions.js'

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
  return( (offset[0]**2 + offset[1]**2 <= SPECS.UNITS[unit].ATTACK_RADIUS[1]) &&
  (offset[0]**2 + offset[1]**2 >= SPECS.UNITS[unit].ATTACK_RADIUS[0]) );
}

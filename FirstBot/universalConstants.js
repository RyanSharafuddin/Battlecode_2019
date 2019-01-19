import {SPECS} from 'battlecode';
export const MODE = {
  SPAWN: 0,
  DO_NOTHING: 1,
  GO_TO_TARGET: 2,
  PATROL: 3,
  WAIT: 4 //currently this does nothing. TODO: implement state machine remembrance and switching and context
          //TODO consider moving around randomly a bit during waiting. Or maybe patrolling a bit.
}

export const PILGRIM_MOVE = SPECS.UNITS[SPECS.PILGRIM].SPEED;

export const NORTH = [-1, 0];
export const NORTHEAST = [-1, 1];
export const EAST = [0, 1];
export const SOUTHEAST = [1, 1];
export const SOUTH = [1, 0];
export const SOUTHWEST = [1, -1];
export const WEST = [0, -1];
export const NORTHWEST = [-1, -1]
export const DIRECT_ADJACENT = [NORTH, EAST, SOUTH, WEST];
export const DIAGONALS = [NORTHEAST, SOUTHEAST, SOUTHWEST, NORTHWEST];
export const ADJACENT = [NORTH, NORTHEAST, EAST, SOUTHEAST, SOUTH, SOUTHWEST, WEST, NORTHWEST];

export const RUSH_BOT = SPECS.PROPHET;

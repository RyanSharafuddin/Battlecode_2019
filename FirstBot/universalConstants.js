import {SPECS} from 'battlecode';
export const MODE = {
  SPAWN_PILGRIMS: 0,
  DO_NOTHING: 1,
  GO_TO_TARGET: 2,
  PATROL: 3,
  MINE: 5,
  DEFEND: 6
}

export const REASON = {
  NEARBY_MINES: 0
}

export const PILGRIM_MOVE = SPECS.UNITS[SPECS.PILGRIM].SPEED;
export const MAX_BOTS = SPECS.MAX_ID;
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

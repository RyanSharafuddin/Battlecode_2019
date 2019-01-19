import * as CONSTANTS from './universalConstants.js'

export class RobotCache {
  constructor() {
    this.robots = new Array(CONSTANTS.MAX_BOTS).fill(null);
  }
  add(obj) {
    // expects {id: robot id, unit: SPECS.CASTLE (etc), team: (1 or 0)}
    this.robots[obj.id] = obj;
  }
  get(id) {
    return this.robots[id];
  }
  contains(id) {
    return(this.robots[id] == null);
  }
}

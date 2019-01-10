import {BCAbstractRobot, SPECS} from 'battlecode';
import {Queue} from './Queue.js';
import {Location} from './Location.js';


//return this.action


class MyRobot extends BCAbstractRobot {




  getOffsetsInRange(movableRadius) {
  //given movableRadius, returns a list of [dy, dx] that can move
  //no regard to offmap or impassable or other robots.
    var offsetsInRange = [];
    var biggestStraightMove = 0;
    while ((biggestStraightMove + 1) ** 2 <= movableRadius) {
      biggestStraightMove += 1;
    }
    for (var xMove = -biggestStraightMove; xMove <= biggestStraightMove; xMove++) {
      for(var yMove = 0; (xMove ** 2) + (yMove ** 2) <= movableRadius; yMove++) {
        if((yMove === 0) && (xMove === 0)) {
          continue;
        }
        offsetsInRange.push([yMove, xMove]);
        if(yMove === 0) {
          continue;
        }
        offsetsInRange.push([-yMove, xMove]);
      }
    }
    return offsetsInRange;
  }

  getMovableOffsets(startLocation, offsetsInRange) {
    //returns a list of offsets can potentially move to
    //Takes into account passable, and off edge, but NOT if other robot is there
    //offsetsInRange from function getOffsetsInRange
    return offsetsInRange.filter(function(offset) {
      var yLoc = startLocation.y + offset[0];
      var xLoc = startLocation.x + offset[1];
      if( yLoc >= sideLength || yLoc < 0) {
        return false;
      }
      if( xLoc >= sideLength || xLoc < 0) {
        return false;
      }
      return map[yLoc][xLoc];
    });

  }

  makeShortestPathTree(startLocation, movableRadius) {
    //perhaps optimize later to stop once found nearest karbonite/fuel
    //location is just [y, x]
    var q = new Queue(4096);
    q.enqueue(startLocation);
    var blankRow = new Array(sideLength);
    var costs = [];
    for (i = 0; i < sideLength; i++) {
      costs.push(blankRow.slice());
    }
    costs[startLocation.y][startLocation.x] = [0, null]; //costs[y][x] = [numMoves, offset to get here from previous]
    while(!q.isEmpty()) {
      var lookAt = q.dequeue();
      var movableOffsets = getMovableOffsets(lookAt, getOffsetsInRange(movableRadius));
      movableOffsets.forEach(function(offset) {
        var locationToExamine = new Location(lookAt.y + offset[0], lookAt.x + offset[1]);
        if(costs[locationToExamine.y][locationToExamine.x] === undefined) {
          costs[locationToExamine.y][locationToExamine.x] = [costs[lookAt.y][lookAt.x][0] + 1, offset];
          q.enqueue(locationToExamine);
        }
      });
    }
    return costs;
  }

  getReversePathTo(shortestPathTree, startLoc, endLoc) {
    var reversedDirectionList = [];
    var currentLoc = endLoc;
    while(!currentLoc.equals(startLoc)) {
      var offsetToGetHere = shortestPathTree[currentLoc.y][currentLoc.x][1];
      reversedDirectionList.push(offsetToGetHere);
      currentLoc = new Location(currentLoc.y - offsetToGetHere[0], currentLoc.x - offsetToGetHere[1]);
    }
    return reversedDirectionList;
  }

  turn() {

    if(this.me.turn == 1) {
      karbMap = this.karbonite_map;
      fuelMap = this.fuel_map;
      map = this.map;
      sideLength = map.length;
    }

    switch (this.me.unit) {
      case SPECS.CASTLE:
        this.log("Castle. Turn: " + this.me.turn);
        break;
      case SPECS.CHURCH:
        this.log("Church. Turn: " + this.me.turn);
        break;
      case SPECS.PILGRIM:
        this.log("Pilgrim. Turn: " + this.me.turn);
        break;
      case SPECS.CRUSADER:
        this.log("Crusader. Turn: " + this.me.turn);
        break;
      case SPECS.PROPHET:
        this.log("Prophet. Turn: " + this.me.turn);
        break;
      case SPECS.PREACHER:
        this.log("Preacher. Turn: " + this.me.turn);
        break;
      default:
    }
  }

}

var robot = new MyRobot();
var karbMap = undefined;
var fuelMap = undefined;
var map = undefined;
var sideLength = undefined;

const NORTH = [-1, 0];
const NORTHEAST = [-1, 1];
const EAST = [0, 1];
const SOUTHEAST = [1, 1];
const SOUTH = [1, 0];
const SOUTHWEST = [1, -1];
const WEST = [0, -1];
const NORTHWEST = [-1, -1]

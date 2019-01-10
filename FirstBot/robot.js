import {BCAbstractRobot, SPECS} from 'battlecode';
import {Queue} from './Queue.js';
import {Location} from './Location.js';
import {getMinIndex} from './utilities.js'

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
      if( yLoc >= this.map.length || yLoc < 0) {
        return false;
      }
      if( xLoc >= this.map.length || xLoc < 0) {
        return false;
      }
      return this.map[yLoc][xLoc];
    }.bind(this));

  }

  makeShortestPathTree(startLocation, movableRadius) {
    //TODO: perhaps optimize later to stop once found nearest karbonite/fuel
    //location is just [y, x]
    var q = new Queue(4096);
    q.enqueue(startLocation);
    var blankRow = new Array(this.map.length);
    var costs = [];
    for (var i = 0; i < this.map.length; i++) {
      costs.push(blankRow.slice());
    }
    costs[startLocation.y][startLocation.x] = [0, null]; //costs[y][x] = [numMoves, offset to get here from previous]
    while(!q.isEmpty()) {
      var lookAt = q.dequeue();
      var movableOffsets = this.getMovableOffsets(lookAt, this.getOffsetsInRange(movableRadius));
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
    var reversedDirectionList = []; //returns [dy, dx] offsets
    var currentLoc = endLoc;
    while(!currentLoc.equals(startLoc)) {
      var offsetToGetHere = shortestPathTree[currentLoc.y][currentLoc.x][1];
      reversedDirectionList.push(offsetToGetHere);
      currentLoc = new Location(currentLoc.y - offsetToGetHere[0], currentLoc.x - offsetToGetHere[1]);
    }
    return reversedDirectionList;
  }

//TODO: For castles and churches, on turn 1, make list of available building locations
//TODO: perhaps have castles and churches keep track off and tell units their order in turn queue??
  turn() {

    if(this.me.turn == 1) {
      //TODO: optimize later to take advantage of map symmetry
      //TODO: perhaps sort this by nearest to furthest from bot?
      this.karbList = [];
      this.fuelList = []
      for(var y = 0; y < this.map.length; y++) {
        for (var x = 0; x < this.map.length; x++) {
          if(this.karbonite_map[y][x]) {
            this.karbList.push([y,x]);
          }
          if(this.fuel_map[y][x]) {
            this.fuelList.push([y,x]);
          }
        }
      }
    }

    switch (this.me.unit) {
      case SPECS.CASTLE:
        //this.log("Castle. Turn: " + this.me.turn); TODO: uncomment
        var audibleRobots = this.getVisibleRobots();
        var hearingSignal = false;
        if(this.me.turn === 1 ) {
          for(var i = 0; i < audibleRobots.length; i++) {
            var robot = audibleRobots[i];
            if(robot.id !== this.me.id && robot.castle_talk == 1) {
              hearingSignal = true;
              this.log("I am hearing a signal");
              return null;
            }
          }
          //this.log("Not hearing signal.");
          if(!hearingSignal) {
            this.castleTalk(1);
            var diagonalFound = false;
            var diagonalIndex = 0;
            for(; diagonalIndex <= 3; diagonalIndex++) {
              if(this.map[this.me.y + DIAGONALS[diagonalIndex][0]][this.me.x + DIAGONALS[diagonalIndex][1]]) {
                diagonalFound = true;
                break;
              }
            }
            if(diagonalFound) {
              this.log("Found an unoccupied diagonal; building pilgrim in: " + JSON.stringify(DIAGONALS[diagonalIndex]));
              return this.buildUnit(SPECS.PILGRIM, DIAGONALS[diagonalIndex][1], DIAGONALS[diagonalIndex][0]);
            }
            else {
              this.log("All diagonals are occupied");
            }
          }
        }
        break;
      case SPECS.CHURCH:
        this.log("Church. Turn: " + this.me.turn);
        break;
      case SPECS.PILGRIM:
        this.log("Pilgrim. Turn: " + this.me.turn);
        //TODO: generalize to nearest fuel and nearest karb function
        //TODO: consider going to second nearest and stuff
        if(this.me.turn === 1) {
          this.shortestPathTree = this.makeShortestPathTree(new Location(this.me.y, this.me.x), SPECS.UNITS[SPECS.PILGRIM].SPEED);
          this.karbCosts = [];
          for(var i = 0; i < this.karbList.length; i++) {
            var karbLoc = this.karbList[i];
            this.karbCosts.push(this.shortestPathTree[karbLoc[0]][karbLoc[1]][0]);
          }
          var minKarbIndex = getMinIndex(this.karbCosts);
          var nearestKarbCoords = this.karbList[minKarbIndex];
          this.log("Coordinates of nearest karbonite are: " + JSON.stringify(nearestKarbCoords));
          this.reversePathToNearestKarb = this.getReversePathTo(this.shortestPathTree, new Location(this.me.y, this.me.x), new Location(this.karbList[minKarbIndex][0], this.karbList[minKarbIndex][1]));
          this.log("The reverse path to nearest karbonite is: ");
          this.log(JSON.stringify(this.reversePathToNearestKarb));
          this.moveToDo = this.reversePathToNearestKarb.length - 1;
        }
        if(this.moveToDo >= 0) {
          this.log("doing move: " + JSON.stringify(this.reversePathToNearestKarb[this.moveToDo]));
          var dy = this.reversePathToNearestKarb[this.moveToDo][0];
          var dx = this.reversePathToNearestKarb[this.moveToDo][1];
          this.moveToDo -= 1;
          return this.move(dx, dy);
        }
        else {
          return null;
        }
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

const NORTH = [-1, 0];
const NORTHEAST = [-1, 1];
const EAST = [0, 1];
const SOUTHEAST = [1, 1];
const SOUTH = [1, 0];
const SOUTHWEST = [1, -1];
const WEST = [0, -1];
const NORTHWEST = [-1, -1]
const ADJACENT = [NORTH, EAST, SOUTH, WEST];
const DIAGONALS = [NORTHEAST, SOUTHEAST, SOUTHWEST, NORTHWEST];

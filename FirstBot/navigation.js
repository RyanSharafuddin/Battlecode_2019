import {Queue} from './Queue.js';
import {Location} from './Location.js';
import * as utilities from './utilities.js'

export function getOffsetsInRange(movableRadius) {
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

  export function getMovableOffsets(startLocation, offsetsInRange, map) {
      //returns a list of offsets can potentially move to
      //Takes into account passable, and off edge, but NOT if other robot is there
      //offsetsInRange from function getOffsetsInRange
      return offsetsInRange.filter(function(offset) {
        var yLoc = startLocation.y + offset[0];
        var xLoc = startLocation.x + offset[1];
        if( yLoc >= map.length || yLoc < 0) {
          return false;
        }
        if( xLoc >= map.length || xLoc < 0) {
          return false;
        }
        return map[yLoc][xLoc];
      });
    }

    export function makeShortestPathTree(startLocation, movableRadius, map) {
        //TODO: perhaps optimize later to stop once found nearest karbonite/fuel
        //location is just [y, x]
        var q = new Queue(4096);
        q.enqueue(startLocation);
        var blankRow = new Array(map.length);
        var costs = [];
        for (var i = 0; i < map.length; i++) {
          costs.push(blankRow.slice());
        }
        costs[startLocation.y][startLocation.x] = [0, null]; //costs[y][x] = [numMoves, offset to get here from previous]
        while(!q.isEmpty()) {
          var lookAt = q.dequeue();
          var movableOffsets = getMovableOffsets(lookAt, getOffsetsInRange(movableRadius), map);
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

  export function getReversePathTo(shortestPathTree, startLoc, endLoc) {
      var reversedDirectionList = []; //returns [dy, dx] offsets
      var currentLoc = endLoc;
      while(!currentLoc.equals(startLoc)) {
        var offsetToGetHere = shortestPathTree[currentLoc.y][currentLoc.x][1];
        reversedDirectionList.push(offsetToGetHere);
        currentLoc = new Location(currentLoc.y - offsetToGetHere[0], currentLoc.x - offsetToGetHere[1]);
      }
      return reversedDirectionList;
    }

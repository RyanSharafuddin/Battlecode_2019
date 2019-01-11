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

  export function compareRow(maps, firstRow, secondRow) {
    //returns true if map[firstRow] = map[secondRow] for all maps in map
    var numMaps = maps.length;
    for (var square = 0; square < maps[0].length; square++) {
      for (var currentMap = 0; currentMap < numMaps; currentMap++) {
        if(maps[currentMap][firstRow][square] !== maps[currentMap][secondRow][square]) {
          return false;
        }
      }
    }
    return true;
  }

  export function compareColumn(maps, firstColumn, secondColumn) {
    //ditto above but for columns
    var numMaps = maps.length;
    for(var square = 0; square < maps[0].length; square++) {
      for (var currentMap = 0; currentMap < numMaps; currentMap++) {
        if(maps[currentMap][square][firstColumn] !== maps[currentMap][square][secondColumn]) {
          return false;
        }
      }
    }
    return true;
  }

  export function getSymmetry(maps) {
    //maps is [map, karbonite_map, fuel_map]
    var length = maps[0].length;
    var even = (length % 2) == 0;
    var middle = Math.floor(length / 2);
    for(var line = 0; line <= middle - 1; line++) {
      if(!compareRow(maps, line, length - 1 - line)) {
        return SymmetryEnum.VERTICAL; //vertical symmetry
      }
      if(!compareColumn(maps, line, length - 1 - line)) {
        return SymmetryEnum.HORIZONTAL; //horizontal symmetry
      }
    }
    return SymmetryEnum.INDETERMINATE;
  }

  export function reflectLocation(toReflect, mapLength, symmetryType) {
    //given a location and symmetry type, reflects the location
    var middle = Math.floor(mapLength / 2);
    var even = (mapLength % 2 == 0) ? true : false;
    var originalYOffsetFromMiddle = toReflect.y - middle;
    var originalXOffsetFromMiddle = toReflect.x - middle;

    if(even) {
      var newYCoord = (symmetryType === SymmetryEnum.VERTICAL) ? toReflect.y : middle - originalYOffsetFromMiddle - 1;
      var newXCoord = (symmetryType === SymmetryEnum.HORIZONTAL) ? toReflect.x : middle - originalXOffsetFromMiddle - 1;
      return new Location(newYCoord, newXCoord);
    }
    else {
      var newYCoord = (symmetryType === SymmetryEnum.VERTICAL) ? toReflect.y : middle - originalYOffsetFromMiddle;
      var newXCoord = (symmetryType === SymmetryEnum.HORIZONTAL) ? toReflect.x : middle - originalXOffsetFromMiddle;
      return new Location(newYCoord, newXCoord);
    }
  }

  export var SymmetryEnum = {
    HORIZONTAL: 0,
    VERTICAL: 1,
    INDETERMINATE: 2
  };

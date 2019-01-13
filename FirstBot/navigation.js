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

    export function makeShortestPathTree(startLocation, movableRadius, map, extras) {
        //TODO: perhaps optimize later to stop once found nearest karbonite/fuel
        //location is just [y, x]
        try {
          var q = new Queue(4096);
          q.enqueue(startLocation);
          var blankRow = new Array(map.length);
          var costs = [];
          for (var i = 0; i < map.length; i++) {
            costs.push(blankRow.slice());
          }
          costs[startLocation.y][startLocation.x] = [0, null]; //costs[y][x] = [numMoves, offset to get here from previous]
        }
        catch (err) {
          extras.state.log("The error is not in the queue loop");
          extras.state.log("startLocation is: " + JSON.stringify(startLocation));
        }
        try {
          while(!q.isEmpty()) {
            var lookAt = q.dequeue();
            var movableOffsets = getMovableOffsets(lookAt, getOffsetsInRange(movableRadius), map);
            movableOffsets.forEach(function(offset) {
              var locationToExamine = new Location(lookAt.y + offset[0], lookAt.x + offset[1]);
              if(extras && extras.forbiddenLocs != undefined) {
                //so far, the only thing in extras is a list of forbiddenLocs
                for(var i = 0; i < extras.forbiddenLocs.length; i++) {
                  if(locationToExamine.equals(extras.forbiddenLocs[i])) {
                    return; //like a continue for the movableOffsets for loop. see https://stackoverflow.com/questions/31399411/go-to-next-iteration-in-javascript-foreach-loop/31399448
                  }
                }
              }

              if(costs[locationToExamine.y][locationToExamine.x] === undefined) {
                costs[locationToExamine.y][locationToExamine.x] = [costs[lookAt.y][lookAt.x][0] + 1, offset];
                q.enqueue(locationToExamine);
              }
            });
          }
        }
        catch(err) {
          extras.state.log("The error is in the queue loop");
        }
        return costs;
      }

  export function getPathTo(shortestPathTree, startLoc, endLoc) {
    //TODO: DEBUG case where endLoc not reachable from startLoc (done, I think)
      var reversedDirectionList = []; //returns [dy, dx] offsets
      var currentLoc = endLoc;
      if(shortestPathTree[currentLoc.y][currentLoc.x] == null) {
        return null; //there is no path because endLoc is unreachable
      }
      while(!currentLoc.equals(startLoc)) {
        var offsetToGetHere = shortestPathTree[currentLoc.y][currentLoc.x][1];
        reversedDirectionList.push(offsetToGetHere);
        currentLoc = new Location(currentLoc.y - offsetToGetHere[0], currentLoc.x - offsetToGetHere[1]);
      }
      return reversedDirectionList.reverse();
  }

  export function getLocsByCloseness(shortestPathTree, listOfLocs) {
    //relative to a starting location and a shortest path tree, returns a list
    //[[loc, cost], [loc, cost]] that is sorted by closeness
    //TODO: DEBUG case where some Locs not reachable (done, I think)
    var newList = []
     for(var i = 0; i < listOfLocs.length; i++) {
       var loc = listOfLocs[i];
       (shortestPathTree[loc.y][loc.x] == null) ? newList.push([loc, Number.POSITIVE_INFINITY]) : newList.push([loc, shortestPathTree[loc.y][loc.x][0]]);
     }
     newList.sort(function(a, b) {
       //DEBUG if both infinty, return 0
       if( a == Number.POSITIVE_INFINITY && b == Number.POSITIVE_INFINITY){
         return 0;
       }
       return(a[1] - b[1]);
     });
     return newList;
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
    if(symmetryType == SymmetryEnum.INDETERMINATE) {
      return null;
    }
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

  export function idAtOffset(offset, state) {
    //returns the id of the robot at offset from calling robot (encapsulated in state)
    //or -1 if tile is offmap or invisible
    var newY = state.me.y + offset[0];
    var newX = state.me.x + offset[1];
    if(newY < 0 || newY >= state.map.length) {
      return -1;
    }
    if(newX < 0 || newX >= state.map.length) {
      return -1;
    }
    return (state.getVisibleRobotMap()[newY][newX]);
  }

  export var SymmetryEnum = {
    HORIZONTAL: 0,
    VERTICAL: 1,
    INDETERMINATE: 2
  };

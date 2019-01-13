import {Queue} from '../Queue.js';
import {Location} from '../Location.js';
import * as utilities from '../utilities.js'
import * as navigation from '../navigation.js'
import * as robotFunctions from '../robotFunctions.js'
//import * as attacker from '../attacker.js' //can't test attacker b/c it imports battlecode?

// var buildableOffsets = [[1, -1], [-1, 1], [1, 0], [-1,-1]];
// var a = {}
// robotFunctions.rememberStartingConnectedComponents(a, buildableOffsets);
// console.log(JSON.stringify(a.startingConnectedComponents));
// var Loc1 = [0, 2];
// var Loc2 = [0, 2];
// var Loc3 = new Location(2, 0);
//
// var set = new Set([Loc1]);
// console.log(set.has(Loc1));
// console.log(set.has(Loc2));
// console.log(set.has(Loc3));

// var loc1 = new Location(3,4);
// var offset = [-1, 2];
// var loc2 = loc1.addOffset(offset);
// console.log(JSON.stringify(loc1));
// console.log(JSON.stringify(loc2));

// var loc1 = new Location(3, 4);
// var loc2 = new Location(3,4 );
// var loc3 = new Location(3,5 );
// console.log(loc1.equals(loc2));
// console.log(loc1.equals(loc3));
// var obj = { m: 1, arr: [1,2,3], arrarr: [[1,2], [1,2]], inner: {a:4}};
// console.log(utilities.dump(obj));
// console.log(utilities.dump(obj))

function makeShortestPathsTree(startLocation, movableRadius, map, extras) {
    //NOTE: This is not the same as the function in Navigation. Do not confuse the 2.
    var q = new Queue(4096);
    q.enqueue(startLocation);
    var blankRow = new Array(map.length);
    var costs = [];
    for (var i = 0; i < map.length; i++) {
      costs.push(blankRow.slice());
    }
    costs[startLocation.y][startLocation.x] = [0, []]; //costs[y][x] = [numMoves, offsets to get here from previous]
    while(!q.isEmpty()) {
      var lookAt = q.dequeue();
      var movableOffsets = navigation.getMovableOffsets(lookAt, navigation.getOffsetsInRange(movableRadius), map);
      movableOffsets.forEach(function(offset) {
        var locationToExamine = lookAt.addOffset(offset);
        if(extras && extras.forbiddenLocs != undefined) {
          //so far, the only thing in extras is a list of forbiddenLocs
          for(var i = 0; i < extras.forbiddenLocs.length; i++) {
            if(locationToExamine.equals(extras.forbiddenLocs[i])) {
              return; //like a continue for the movableOffsets for loop. see https://stackoverflow.com/questions/31399411/go-to-next-iteration-in-javascript-foreach-loop/31399448
            }
          }
        }
        var costCell = costs[locationToExamine.y][locationToExamine.x];
        if(costCell === undefined) {
          costs[locationToExamine.y][locationToExamine.x] = [costs[lookAt.y][lookAt.x][0] + 1, [offset]];
          q.enqueue(locationToExamine);
        }
        else if(costCell[0] == costs[lookAt.y][lookAt.x][0] + 1) {
          costs[locationToExamine.y][locationToExamine.x][1].push(offset);
        }
      });
    }
    return costs;
  }

  function backTrackAllShortestPaths(solutions, currentSolution, costs, endLoc) {
    (currentSolution.length == 0) ? currentSolution = [endLoc] : currentSolution = currentSolution;
    var lastLoc = currentSolution[currentSolution.length - 1];
    if(costs[lastLoc.y][lastLoc.x][1].length == 0) {
      return solutions.push(currentSolution);
    }
    var extensions = costs[lastLoc.y][lastLoc.x][1];
    extensions.forEach(function(extension) {
      var nextGenSol = currentSolution.slice(); //WARNING: Your get extension should not modify the current solution
      nextGenSol.push(new Location(lastLoc.y - extension[0], lastLoc.x - extension[1]));
      solutions.concat(backTrackAllShortestPaths(solutions, nextGenSol, costs, endLoc));
    });
    return solutions;
  }

  function reverseEach(lst) {
    lst.forEach(function(thing){
      thing.reverse();
    })
  }

  // var map = [
  //   [true, true, true],
  //   [true, true, true],
  //   [true, true, true]
  // ];

  var map = [
    [true, true, true],
    [true, true, true],
    [true, true, true]
  ];
  var costs = makeShortestPathsTree(new Location(0,0), 1, map)
  utilities.dump(costs, console);
  var paths = backTrackAllShortestPaths([], [], costs, new Location(map[0].length - 1, map[0].length - 1));
  console.log("PRINTING ALL PATHS");
  var i = 1;
  paths.forEach(function(path) {
    console.log(i + ": " + JSON.stringify(path.reverse()) + "\n");
    i++;
  })

  /*
    Clever clever.
    The above is a backtracking algorithm for getting all shortest paths from start to end,
    where the start is specified in the make makeShortestPathsTree argument, and end is
    specified when printing the path
  */

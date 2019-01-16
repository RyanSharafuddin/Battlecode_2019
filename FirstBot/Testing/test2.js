import {Queue} from '../Queue.js';
import {Location} from '../Location.js';
import * as utilities from '../utilities.js'
// import * as navigation from '../navigation.js'
// import * as robotFunctions from '../robotFunctions.js'
//import * as castle from '../castle.js' can't import battlecode for some reason
//import * as CONSTANTS from '../universalConstants.js'
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
    var costs = utilities.makeSquareGrid(map.length, null);
    costs[startLocation.y][startLocation.x] = [0, []]; //costs[y][x] = [numMoves, offsets to get here from previous]
    while(!q.isEmpty()) {
      var lookAt = q.dequeue();
      var movableOffsets = navigation.getMovableOffsets(lookAt, navigation.getOffsetsInRange(movableRadius), map);
      movableOffsets.forEach(function(offset) {
        var locationToExamine = lookAt.addOffset(offset);
        if((extras) && (extras.forbiddenLocs != undefined) && locationToExamine.isInList(extras.forbiddenLocs)) {
          return; //like a continue for the movableOffsets for loop. see https://stackoverflow.com/questions/31399411/go-to-next-iteration-in-javascript-foreach-loop/31399448
        }
        var costCell = costs[locationToExamine.y][locationToExamine.x];
        if(costCell === null) {
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
    if(!costs[lastLoc.y][lastLoc.x]) { //if there's no entry in the costs grid here, then there are no paths to endLoc
      return [];
    }
    if(costs[lastLoc.y][lastLoc.x][1].length == 0) {
      return solutions.push(currentSolution.reverse()); //each path is reversed, so reverse it before adding it on
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

  var map = [
    [true, true, false],
    [true, true, true],
    [true, true, true]
  ];

  // var costs = navigation.makeShortestPathTree(new Location(0,0), 1, map);
  // console.log(JSON.stringify(costs));

  // var costs = makeShortestPathsTree(new Location(0,0), 1, map)
  // utilities.dump(costs, console);
  // var paths = backTrackAllShortestPaths([], [], costs, new Location(map[0].length - 1, map[0].length - 1));
  // console.log("PRINTING ALL PATHS");
  // var i = 1;
  // paths.forEach(function(path) {
  //   console.log(i + ": " + JSON.stringify(path) + "\n");
  //   i++;
  // })

  /*
    Clever clever.
    The above is a backtracking algorithm for getting all shortest paths from start to end,
    where the start is specified in the make makeShortestPathsTree argument, and end is
    specified when printing the path
  */
// var loc1 = new Location(0,0);
// var loc2 = new Location(0,3);
// var loc3 = new Location(-4,3);
// var arr = [loc1, loc2, loc3];
// console.log(new Location(-4,3).isInList(arr));
// console.log(new Location(0,0).isInList(arr));
// console.log(new Location(50,3).isInList(arr));

// console.log(CONSTANTS.MODE.SPAWN);

// var arr = [[new Location(3,4), 8], [new Location(4,5), 9], [new Location(5,6), 10]];
//console.log(utilities.pretty([{"y":31,"x":27},{"y":31,"x":35},{"y":32,"x":28},{"y":29,"x":34},{"y":30,"x":34},{"y":31,"x":34},{"y":30,"x":33},{"y":31,"x":28},{"y":31,"x":33},{"y":32,"x":30},{"y":34,"x":30},{"y":32,"x":31},{"y":33,"x":28},{"y":33,"x":34},{"y":31,"x":29},{"y":34,"x":29},{"y":32,"x":32},{"y":33,"x":32},{"y":32,"x":34},{"y":33,"x":30},{"y":32,"x":33},{"y":33,"x":29},{"y":33,"x":33},{"y":32,"x":29},{"y":31,"x":32},{"y":34,"x":33},{"y":34,"x":32},{"y":35,"x":31},{"y":34,"x":31},{"y":33,"x":31}]));
utilities.pretty(new Location(3,3));

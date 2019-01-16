import {SPECS} from 'battlecode';
import {Queue} from './Queue.js';
import {Location} from './Location.js';
import * as utilities from './utilities.js'
import * as navigation from './navigation.js'
import * as CONSTANTS from './universalConstants.js'
import * as attacker from './attacker.js'

export function rememberBuildableOffsets(state) {
  //causes state.buildableOffsets to be a list of offsets available for building
  //in if no robot is occupying it
  state.buildableOffsets = navigation.getMovableOffsets(new Location(state.me.y, state.me.x), navigation.getOffsetsInRange(2), state.map);
}

export function rememberStartingConnectedComponents(state, buildableOffsets) {
  //causes state.startingConnectedComponents to be an array of connected components.
  //if second array is empty, state means that there is 1 connected component
  // state.startingConnectedComponents = [[first component], [possibly empty]] each component is a list of offsets
  var numOffsets = buildableOffsets.length;
  var reachableBooleans = new Array(numOffsets).fill(false);
  var q = new Queue(10);
  q.enqueue(0);
  reachableBooleans[0] = true;
  while(!q.isEmpty()) {
    var lookAt = q.dequeue();
    for(var i = 0; i < numOffsets; i++) {
      if(!reachableBooleans[i] && ( (buildableOffsets[i][0] - buildableOffsets[lookAt][0])**2  + (buildableOffsets[i][1] - buildableOffsets[lookAt][1])**2 <= 4)  ) {
        reachableBooleans[i] = true;
        q.enqueue(i);
      }
    }
  }
  var firstComp = [];
  var secondComp = [];
  for(var i = 0; i < numOffsets; i++) {
    (reachableBooleans[i]) ? firstComp.push(buildableOffsets[i]) : secondComp.push(buildableOffsets[i]);
  }
  state.startingConnectedComponents = [firstComp, secondComp];
}

export function allRobotRememberStuff(state) {
  //remember symmetryType, karbList, fuelList
  if(state.me.turn == 1) {
    //TODO: optimize later to take advantage of map symmetry
    //TODO: perhaps sort state by nearest to furthest from bot?
    state.symmetryType = navigation.getSymmetry([state.map, state.karbonite_map, state.fuel_map]);
    state.karbList = [];
    state.fuelList = []
    for(var y = 0; y < state.map.length; y++) {
      for (var x = 0; x < state.map.length; x++) {
        if(state.karbonite_map[y][x]) {
          state.karbList.push([y,x]);
        }
        if(state.fuel_map[y][x]) {
          state.fuelList.push([y,x]);
        }
      }
    }
  }
}

export function rememberSpawnInfo(state, extras) {
  //NOTE: need extras{costs: the shortestPathTree rooted at starting location}
  /*  Sets:
   *  Location state.spawnLoc
   *  boolean state.spawnLocIsCastle
   *  Location state.targetCastleLoc                   //can be null
   *  Location list: state.targetCastleAttackableFrom //can be null if pilgrim or no target castle
   *  [[loc, cost], [loc, cost]] state.targetSquaresByCloseness //the above list sorted by closeness
   *  Location list: state.targetList simply state.targetCastleAttackableFrom sorted by cost, without costs in list
   */
  if(state.me.turn != 1) {
    return;
  }
  var castleLoc = null
  var churchLoc = null;
  for(var i = 0; i < CONSTANTS.ADJACENT.length; i++) {
    var offset = CONSTANTS.ADJACENT[i];
    var id = navigation.idAtOffset(offset, state);
    if(id > 0) {
      var bot = state.getRobot(id);
      if((bot.unit == SPECS.CASTLE) && (bot.team == state.me.team)) {
        castleLoc = new Location(bot.y, bot.x);
      }
      if((bot.unit == SPECS.CHURCH) && (bot.team == state.me.team)) {
        churchLoc = new Location(bot.y, bot.x);
      }
    }
  }
  if(castleLoc) {
    state.spawnedLoc = castleLoc;
    state.spawnedLocIsCastle = true;
    state.targetCastleLoc = navigation.reflectLocation(state.spawnedLoc, state.map.length, state.symmetryType);
    state.targetCastleAttackableFrom = (state.me.unit != SPECS.PILGRIM) ? attacker.attackableFrom(state.targetCastleLoc, state.me.unit, state.map) : null; //locs list
    if(state.targetCastleAttackableFrom && (state.targetCastleAttackableFrom.length > 0)) {
      state.targetSquaresByCloseness = navigation.getLocsByCloseness(extras.costs, state.targetCastleAttackableFrom);
      state.targetList = utilities.flattenFirst(state.targetSquaresByCloseness); //targetList is now [loc, loc] in order of closeness
    }
  }
  else if(churchLoc) {
    state.spawnedLoc = churchLoc;
    state.spawnedLocIsCastle = false;
    state.targetCastleLoc = null;
    state.targetCastleAttackableFrom = null;
  }
}

export function setNewPath(state, maxSpeed, newLoc) {
  state.log("in function setNewPath");
  state.log("maxSpeed is: " + maxSpeed);
  //NOTE: state only works for my very crude "pre mode" stuff. See the initialization of
  //      the crusader for details. returns the value that the main
  //      function should return to move, or null if no move (fix when make mode sytem)
  state.log("Was at point: " +  state.numMoveToMake + " on path: " + utilities.pretty(state.pathToTarget));
  var forbiddenLocs = navigation.getLocsFromOffsets(navigation.getOccupiedMovableOffsets(state, maxSpeed, {friendly: true, enemy: true}), state.myLoc);
  state.log("forbiddenLocs are: " + utilities.pretty(forbiddenLocs));
  var costs = navigation.makeShortestPathTree(state.myLoc, maxSpeed, state.map, {forbiddenLocs: forbiddenLocs});
  //state.log("COSTS IN SETNEWPATH IS: " + utilities.pretty(costs));
  state.pathToTarget = navigation.getPathTo(costs, state.myLoc, newLoc, state);
  state.log("The new path to the target is: " + utilities.pretty(state.pathToTarget));
  // state.log("My new path to target: " + JSON.stringify(state.targetList[state.currentTargetIndex]) + "is: ");
  // state.log(JSON.stringify(state.pathToTarget));
  if(state.pathToTarget == null) {;
    state.mode = CONSTANTS.MODE.WAIT; //TODO: context switch here; remember old state, come back to once done waiting.
    return null; //waiting??? Or switch to patrol? Or what?? TODO: something intelligent
  }
  state.numMoveToMake = 0;
  return vanillaMove(state);
}

export function getNextOpenTarget(state) {
  //return type: Location
  //return the next target in targetList that is either invisible, unoccupied, or occupied by enemy
  //or return null if there is none. WARNING: can return null
  //set state.currentTargetIndex correspondingly
  for(state.currentTargetIndex++; state.currentTargetIndex < state.targetList.length; state.currentTargetIndex++) {
    var potentialTargetLoc = state.targetList[state.currentTargetIndex];
    var idAtPotentialTarget = navigation.idAtOffset([potentialTargetLoc.y - state.myLoc.y, potentialTargetLoc.x - state.myLoc.x], state);
    if( (idAtPotentialTarget <= 0) || (state.getRobot(idAtPotentialTarget).team != state.me.team)) {
      return potentialTargetLoc;
    }
  }
  return null;
}

export function vanillaMove(state) {
  //TODO: consider doing something else if can see enemy bot outside your
  //      own attack radius and you are about to step into its attack radius
  // state.log("There is no bot where I want to move.");
  var moveToMake = state.pathToTarget[state.numMoveToMake];
  state.numMoveToMake += 1;
  // state.log("The next numMoveToMake is: " + state.numMoveToMake);
  if(state.numMoveToMake == state.pathToTarget.length) {
    state.log("WILL HAVE REACHED target after making current move; switching to patrol mode"); //TODO: make switching to mode functions
    state.mode = CONSTANTS.MODE.PATROL; //NOTE: do not return here; still need to make state move
  }
  state.log("Making move: dx: " + moveToMake[1] + " dy: " + moveToMake[0]);
  return state.move(moveToMake[1], moveToMake[0]); //WARNING moveToMake left behind in previous function
}

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
    state.stats = SPECS.UNITS[state.me.unit];
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
  //NOTE: state only works for my very crude "pre mode" stuff. See the initialization of
  //      the rusher for details. returns the value that the main
  //      function should return to move, or null if no move (fix when make mode sytem)
  var forbiddenLocs = navigation.getLocsFromOffsets(navigation.getOccupiedMovableOffsets(state, maxSpeed, {friendly: true, enemy: true}), state.myLoc);
  var costs = navigation.makeShortestPathTree(state.myLoc, maxSpeed, state.map, {forbiddenLocs: forbiddenLocs});
  state.pathToTarget = navigation.getPathTo(costs, state.myLoc, newLoc, state);
  if(state.pathToTarget == null) {
    state.mode = CONSTANTS.MODE.WAIT; //TODO: Consider whether to wait for friendly bots to move
    return null;                      // or see whether to head to next target in target list. Perhaps have a
  }                                   //function that returns how long to wait based on how close the next target is
  state.numMoveToMake = 0;
  return vanillaMove(state);
}

export function getNextOpenTarget(state, maxSpeed) {
  //return type: Location
  //return the next target in targetList that is either invisible, unoccupied, or occupied by enemy
  //or return null if there is none. WARNING: can return null
  //set state.currentTargetIndex correspondingly
  var forbiddenLocs = navigation.getLocsFromOffsets(navigation.getOccupiedMovableOffsets(state, maxSpeed, {friendly: true, enemy: true}), state.myLoc);
  var costs = navigation.makeShortestPathTree(state.myLoc, maxSpeed, state.map, {forbiddenLocs: forbiddenLocs});
  for(state.currentTargetIndex++; state.currentTargetIndex < state.targetList.length; state.currentTargetIndex++) {
    var potentialTargetLoc = state.targetList[state.currentTargetIndex];
    var idAtPotentialTarget = navigation.idAtOffset([potentialTargetLoc.y - state.myLoc.y, potentialTargetLoc.x - state.myLoc.x], state);
    var tiue = ( (idAtPotentialTarget <= 0) || (state.getRobot(idAtPotentialTarget).team != state.me.team)); //target invisible unoccupied or enemy
    if(tiue && navigation.isReachable(costs, potentialTargetLoc)) {
      return potentialTargetLoc;
    }
  }
  return null;
}

export function vanillaMove(state) {
  var moveToMake = state.pathToTarget[state.numMoveToMake];
  state.numMoveToMake += 1;
  if(state.numMoveToMake == state.pathToTarget.length) {
    state.mode = CONSTANTS.MODE.PATROL; //NOTE: do not return here; still need to make state move
  }
  state.log("Making move: dx: " + moveToMake[1] + " dy: " + moveToMake[0]);
  return state.move(moveToMake[1], moveToMake[0]);
}

export function rusherInitialize(state) {
  //calls rememberSpawnInfo and sets up stuff for the mode system
  if(state.me.turn == 1) {
    var costs = navigation.makeShortestPathTree(state.myLoc, SPECS.UNITS[state.me.unit].SPEED, state.map);
    rememberSpawnInfo(state, {costs: costs});
    if((!state.targetSquaresByCloseness) || (state.targetSquaresByCloseness[0][1] == Number.POSITIVE_INFINITY)) {
      //cannot reach a position from which to attack enemy castle, or not spawned from a castle to begin with
      state.mode = CONSTANTS.MODE.PATROL;
    }
    else {
      //TODO mode switching function here
      state.mode = CONSTANTS.MODE.GO_TO_TARGET;
      state.currentTargetIndex = 0;
      state.pathToTarget = navigation.getPathTo(costs, state.myLoc, state.targetList[state.currentTargetIndex], state);
      state.numMoveToMake = 0;
      if(state.pathToTarget == null) {
        state.log("ERROR ERROR ERROR");
      }
    }
  }
}

export function rusherTurn(state) {
  //After turn 1 setup, before anything else (i.e. in all modes)
  var attackable = attacker.getAttackablePrioritizedByUnit(state);
  if(attackable.length > 0) {
    return state.attack(attackable[0].x - state.me.x, attackable[0].y - state.me.y);
  }
  if(state.mode == CONSTANTS.MODE.PATROL) {
    //TODO patrol code
    state.log("Rusher @ " + JSON.stringify(state.myLoc) + " and is in patrol mode");
    return null;
  }
  if(state.mode == CONSTANTS.MODE.WAIT) {
    return null; //TODO: Implement
  }
  if(state.mode == CONSTANTS.MODE.GO_TO_TARGET) {
    var moveToMake = state.pathToTarget[state.numMoveToMake]; //WARNING see robotFunctions
    var idAtMove = navigation.idAtOffset(moveToMake, state);
    var botAtMove;
    if(idAtMove > 0) { //bot at place I want to move
      botAtMove = state.getRobot(idAtMove);
      var friendlyAtMove = (botAtMove.team === state.me.team);
      if(friendlyAtMove) {
        if(state.numMoveToMake == state.pathToTarget.length - 1) {
          //were about to move to target and is blocked by friendly bot
           var potentialTargetLoc = getNextOpenTarget(state, state.stats.SPEED);
           if(potentialTargetLoc == null) {
             state.mode = CONSTANTS.MODE.PATROL; //TODO consider waiting?
             return null;
           }
           else {
             return setNewPath(state, SPECS.UNITS[state.me.unit].SPEED, potentialTargetLoc);
           }
        }

        else { //friendly bot where I want to move, but weren't about to move to target
          return setNewPath(state, SPECS.UNITS[state.me.unit].SPEED, state.targetList[state.currentTargetIndex]);
        }
      }
      else { //there's a bot where I want to move, but it's enemy bot
        throw "WTH? Shouldn't I have attacked state? Enemy at place I want to move.";
        return null;
      }
    }

    else { //there is no bot where I want to move
      return vanillaMove(state);
    }
  }
}

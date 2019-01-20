import {SPECS} from 'battlecode';
import {Queue} from './Queue.js';
import {Location} from './Location.js';
import * as utilities from './utilities.js'
import * as navigation from './navigation.js'
import * as CONSTANTS from './universalConstants.js'
import * as attacker from './attacker.js'
import {RobotCache} from './robotCache.js';

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

export function initializeAll(state) {
  //remember symmetryType, karbLocs, fuelLocs
  if(state.me.turn == 1) {
    state.robotCache = new RobotCache();
    var costs = navigation.makeShortestPathTree(new Location(state.me.y, state.me.x), CONSTANTS.PILGRIM_MOVE, state.map);
    state.stats = SPECS.UNITS[state.me.unit];
    state.symmetryType = navigation.getSymmetry([state.map, state.karbonite_map, state.fuel_map]);
    state.karbLocs = [];
    state.fuelLocs = []
    for(var y = 0; y < state.map.length; y++) {
      for (var x = 0; x < state.map.length; x++) {
        if(state.karbonite_map[y][x] && navigation.isReachable(costs, new Location(y,x))) {
          state.karbLocs.push(new Location(y, x));
        }
        if(state.fuel_map[y][x] && navigation.isReachable(costs, new Location(y,x))) {
          state.fuelLocs.push(new Location(y, x));
        }
      }
    }
  }
  //stuff to set every turn
  state.signalsToSend = [];
  state.castleTalksToSend = [];
  state.myLoc = new Location(state.me.y, state.me.x);
  state.visibleEnemies = [];
  state.visibleFriends = [];
  state.radioingRobots = [];
  state.attackableRobots = [];
  var robos = state.getVisibleRobots();
  for (var i = 0; i < robos.length; i++) {
    var robo = robos[i];
    if(state.isVisible(robo)) {
      state.robotCache.add({id: robo.id, unit: robo.unit, team: robo.team});
      ( (robo.team == state.me.team) && (robo.id != state.me.id)) ? state.visibleFriends.push(robo) : state.visibleEnemies.push(robo);
      if( (robo.team != state.me.team) && attacker.isOffsetInAttackingRange([robo.y - state.me.y, robo.x - state.me.x], state.me.unit)) {
        state.attackableRobots.push(robo);
      }
    }
    if(state.isRadioing(robo) && (state.me.id != robo.id)) {
        state.radioingRobots.push(robo);
    }
  }
}

  function setSpawnList(state) {
    var firstCCcloseness = navigation.numMovesTo(state.firstCCshortestPathTree, state.enemyCastles[0]);
    var secondCCcloseness = (state.startingConnectedComponents[1].length !== 0) ? navigation.numMovesTo(state.secondCCshortestPathTree, state.enemyCastles[0]) : Number.POSITIVE_INFINITY;
    if(firstCCcloseness === Number.POSITIVE_INFINITY && secondCCcloseness === Number.POSITIVE_INFINITY) {
      state.spawn_list = null;
      state.log("The corresponding enemy castle of this castle is unreachable by move radius 4.");
    }
    else if(firstCCcloseness !== Number.POSITIVE_INFINITY) {
      state.spawn_list = state.startingConnectedComponents[0];
    }
    else { //second one is only usable one
      state.spawn_list = state.startingConnectedComponents[1];
    }
}

export function buildingInitialize(state) {
  if(state.me.turn == 1) {
    //both turn 1
    rememberBuildableOffsets(state);
    rememberStartingConnectedComponents(state, state.buildableOffsets);

    var offsetToUse = [state.startingConnectedComponents[0][0][0], state.startingConnectedComponents[0][0][1]];
    var beginLoc = state.myLoc.addOffset(offsetToUse);
    state.firstCCshortestPathTree = navigation.makeShortestPathTree(beginLoc, CONSTANTS.PILGRIM_MOVE, state.map, {state: state});

    if(state.startingConnectedComponents[1].length !== 0) {
      var offsetToUse = [state.startingConnectedComponents[1][0][0], state.startingConnectedComponents[1][0][1]];
      var beginLoc = state.myLoc.addOffset(offsetToUse);
      state.secondCCshortestPathTree = navigation.makeShortestPathTree(beginLoc, CONSTANTS.PILGRIM_MOVE, state.map);
    }

    state.karbLocsOne = navigation.getLocsByCloseness(state.firstCCshortestPathTree, state.karbLocs);
    state.karbLocsTwo = (state.startingConnectedComponents[1].length !== 0) ? navigation.getLocsByCloseness(state.secondCCshortestPathTree, state.karbLocs) : [];

    state.fuelLocsOne = navigation.getLocsByCloseness(state.firstCCshortestPathTree, state.fuelLocs);
    state.fuelLocsTwo = (state.startingConnectedComponents[1].length !== 0) ? navigation.getLocsByCloseness(state.secondCCshortestPathTree, state.fuelLocs) : [];
    state.myCastles = [];
    state.enemyCastles = [];
    if(state.me.unit == SPECS.CASTLE) {
      //castle turn 1
      state.myCastles.push(state.myLoc);
      if(state.symmetryType != navigation.SymmetryEnum.INDETERMINATE) {
        state.enemyCastles.push(navigation.reflectLocation(state.myLoc, state.map.length, state.symmetryType));
        setSpawnList(state);
      }
    }
    else { //church turn 1

    }
  }
  //both every turn
  state.unoccupiedBuildableOffsets = [];
  for(var i = 0; i < state.buildableOffsets.length; i++) {
    var offset = state.buildableOffsets[i];
    if(navigation.isOffsetUnoccupied(offset, state)) {
      state.unoccupiedBuildableOffsets.push(offset);
    }
  }
  if(state.me.unit == SPECS.CASTLE) {
    //castle every turn
    state.castleTalkingRobots = [];
    var visBots = state.getVisibleRobots();
    for(var i = 0; i < visBots.length; i++) {
      var bot = visBots[i];
      if( (bot.castle_talk > 0) && (bot.id != state.me.id)) {
        state.castleTalkingRobots.push(bot);
      }
    }

  }
  else { //church every turn

  }
}

export function nonBuildingInitialize(state) {
  /*  Sets:
   *  Location state.spawnedLoc
   *  boolean state.spawnedLocIsCastle
   *  Location[] state.myCastles            //can be empty, if spawned at church
   *  Location[]  state.enemyCastles        //can be empty, if spawned at church
   */
  if(state.me.turn != 1) {
    return;
  }
  state.myCastles = [];
  state.enemyCastles = [];
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
    state.myCastles.push(castleLoc);
    if(state.symmetryType != navigation.SymmetryEnum.INDETERMINATE) {
      state.enemyCastles.push(navigation.reflectLocation(castleLoc, state.map.length, state.symmetryType));
    }
  }
  else if(churchLoc) {
    state.spawnedLoc = churchLoc;
    state.spawnedLocIsCastle = false;
  }
}

//----------------------------CONVENIENCE FUNCTIONS------------------------------

export function signalWrapper(state, value, radius) {
  state.signalsToSend.push({value: value, radius: radius});
}

export function castleTalkWrapper(state, value) {
  state.castleTalksToSend.push(value);
}

export function setModeGoTo(state, targetList, maxSpeed, nextMode, avoidLocs, extras) {
  var occupiedMovableLocs = navigation.getLocsFromOffsets(navigation.getOccupiedMovableOffsets(state, maxSpeed, {friendly: true, enemy: true}), state.myLoc);
  var forbiddenLocs = occupiedMovableLocs.concat(avoidLocs); //concatenate with avoid locs.
  var costs = navigation.makeShortestPathTree(state.myLoc, maxSpeed, state.map, {forbiddenLocs: forbiddenLocs});
  targetList = utilities.flattenFirst(navigation.getLocsByCloseness(costs, targetList));
  var pathToTarget = null;
  var currentTargetIndex = 0;
  for(; currentTargetIndex < targetList.length; currentTargetIndex++) {
    pathToTarget = navigation.getPathTo(costs, state.myLoc, targetList[currentTargetIndex]);
    if(pathToTarget != null) {
      break;
    }
  }
  var numMoveToMake = 0;
  var modeInfo = {
    pathToTarget: pathToTarget,
    numMoveToMake: numMoveToMake,
    maxSpeed: maxSpeed,
    targetList: targetList,
    currentTargetIndex: currentTargetIndex,
    avoidLocs: avoidLocs,
    nextMode: nextMode,
    modeVal: CONSTANTS.MODE.GO_TO_TARGET
  };
  state.modesList.push(modeInfo);
  state.modeIndex = state.modesList.length - 1;
  state.currentModeInfo = modeInfo;
  if(pathToTarget == null) {
    state.currentModeInfo.extras = {waiting: true}
  }
  state.log("Have finished function setModeGoTo.");
  state.log("Modes list: " + utilities.pretty(state.modesList));
}

export function goToTurn(state, avoidLocs, extras) {
  var mi = state.currentModeInfo;
  mi.avoidLocs = avoidLocs; //NOTE: If ya need permanent avoidLocs, then change this line to concat or something.
  if(mi.extras && mi.extras.waiting) {
    var forbiddenLocs = navigation.getLocsFromOffsets(navigation.getOccupiedMovableOffsets(state, mi.maxSpeed, {friendly: true, enemy: true}), state.myLoc).concat(avoidLocs);
    var costs = navigation.makeShortestPathTree(state.myLoc, mi.maxSpeed, state.map, {forbiddenLocs: forbiddenLocs});
    if(mi.currentTargetIndex >= mi.targetList.length) { //recalculate targetList and try going, and set extras.waiting to false
      mi.targetList = utilities.flattenFirst(navigation.getLocsByCloseness(costs, mi.targetList));
      mi.currentTargetIndex = 0;
    }
    if(navigation.isReachable(costs, mi.targetList[mi.currentTargetIndex])) {
      //go go go
      mi.pathToTarget = navigation.getPathTo(costs, state.myLoc, mi.targetList[0]);
      mi.numMoveToMake = 0;
      mi.extras = undefined;
    }
    else { //keep waiting
      return null;
    }
  }
  var moveToMake = mi.pathToTarget[mi.numMoveToMake];
  var idAtMove = navigation.idAtOffset(moveToMake, state);
  var botAtMove;
  if(idAtMove > 0) { //bot at place I want to move
    botAtMove = state.getRobot(idAtMove);
    var friendlyAtMove = (botAtMove.team === state.me.team);
    if(friendlyAtMove) {
      if(mi.numMoveToMake == mi.pathToTarget.length - 1) {
        //were about to move to target and is blocked by friendly bot
         var potentialTargetLoc = getNextOpenTarget(state);
         if(potentialTargetLoc == null) { //TODO go to wait mode after resetting currentTargetIndex
           state.log("Waiting for path to clear up");
           mi.extras = {waiting: true};
           return null;
         }
         else {
           return setNewPath(state, potentialTargetLoc);
         }
      }

      else { //friendly bot where I want to move, but weren't about to move to target
        return setNewPath(state, state.targetList[state.currentTargetIndex]);
      }
    }
    else { //there's a bot where I want to move, but it's enemy bot
      throw "WTH? Shouldn't I have switched to attack or enemy handler state? Enemy at place I want to move.";
      return null;
    }
  }

  else { //there is no bot where I want to move
    return vanillaMove(state);
  }
}

export function setNewPath(state, newLoc) {
  var mi = state.currentModeInfo;
  var forbiddenLocs = navigation.getLocsFromOffsets(navigation.getOccupiedMovableOffsets(state, mi.maxSpeed, {friendly: true, enemy: true}), state.myLoc).concat(mi.avoidLocs);
  var costs = navigation.makeShortestPathTree(state.myLoc, mi.maxSpeed, state.map, {forbiddenLocs: forbiddenLocs});
  mi.pathToTarget = navigation.getPathTo(costs, state.myLoc, newLoc, state);
  if(mi.pathToTarget == null) {
    mi.extras = {waiting: true}; //TODO: implement waiting mode, don't reset target index
    state.log("Waiting for path to clear up.")
    return null;
  }
  mi.numMoveToMake = 0;
  return vanillaMove(state);
}

export function getNextOpenTarget(state) {
  //return type: Location
  //return the next target in targetList that is either invisible, unoccupied, or occupied by enemy (if see enemy, should trigger different mode anyway)
  //or return null if there is none. WARNING: can return null
  //set state.currentTargetIndex correspondingly
  var mi = state.currentModeInfo;
  var forbiddenLocs = navigation.getLocsFromOffsets(navigation.getOccupiedMovableOffsets(state, maxSpeed, {friendly: true, enemy: true}), state.myLoc).concat(mi.avoidLocs);
  var costs = navigation.makeShortestPathTree(state.myLoc, mi.maxSpeed, state.map, {forbiddenLocs: forbiddenLocs});
  for(mi.currentTargetIndex++; mi.currentTargetIndex < mi.targetList.length; mi.currentTargetIndex++) {
    var potentialTargetLoc = mi.targetList[mi.currentTargetIndex];
    var idAtPotentialTarget = navigation.idAtOffset([potentialTargetLoc.y - state.myLoc.y, potentialTargetLoc.x - state.myLoc.x], state);
    var tiue = ( (idAtPotentialTarget <= 0) || (state.getRobot(idAtPotentialTarget).team != state.me.team)); //target invisible unoccupied or enemy
    if(tiue && navigation.isReachable(costs, potentialTargetLoc)) {
      return potentialTargetLoc;
    }
  }
  return null;
}

export function vanillaMove(state) {
  var mi = state.currentModeInfo;
  var moveToMake = mi.pathToTarget[mi.numMoveToMake];
  mi.numMoveToMake += 1;
  if(mi.numMoveToMake == mi.pathToTarget.length) {
    //throw error if modeIndex is not the last index of modesList
    if(state.modeIndex != state.modesList.length -1) {
      throw "Did not push go to mode on properly";
    }
    state.modeIndex = mi.nextMode;
    state.modesList.pop();
    state.currentModeInfo = state.modesList[mi.nextMode]; //NOTE switching to mode supplied to in nextMode
  }
  state.log("Making move: dx: " + moveToMake[1] + " dy: " + moveToMake[0]);
  return state.move(moveToMake[1], moveToMake[0]);
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
    var moveToMake = state.pathToTarget[state.numMoveToMake];
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

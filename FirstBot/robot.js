import {BCAbstractRobot, SPECS} from 'battlecode';
import {Queue} from './Queue.js';
import {Location} from './Location.js';
import * as utilities from './utilities.js'
import * as navigation from './navigation.js'
import * as robotFunctions from './robotFunctions.js'
import * as attacker from './attacker.js'


class MyRobot extends BCAbstractRobot {
//TODO: perhaps have castles and churches keep track of and tell units their order in turn queue??

  logList(lst) {
    for(var i = 0; i < lst.length; i++) {
      (i % 2 == 0) ? this.log(lst[i]) : this.log(JSON.stringify(lst[i]));
    }
  }

  turn() {
    robotFunctions.allRobotRememberStuff(this);
    var myLoc = new Location(this.me.y, this.me.x);

    switch (this.me.unit) {
      case SPECS.CASTLE:
        this.log("Castle. Turn: " + this.me.turn);
        if(this.me.turn == 1) {
          robotFunctions.rememberBuildableOffsets(this);
          robotFunctions.rememberStartingConnectedComponents(this, this.buildableOffsets); //TODO remove if buggy
          this.correspondingEnemyCastleLoc = navigation.reflectLocation(new Location(this.me.y, this.me.x), this.map.length, this.symmetryType);
          if(this.correspondingEnemyCastleLoc == null) {
            this.mode == MODE.DO_NOTHING;
            return null;
          }

          var attackingLocations = attacker.attackableFrom(this.correspondingEnemyCastleLoc, RUSH_BOT, this.map);
        //  try {
            var offsetToUse = [this.startingConnectedComponents[0][0][0], this.startingConnectedComponents[0][0][1]];
            var beginLoc = myLoc.addOffset(offsetToUse);
            this.firstCCshortestPathTree = navigation.makeShortestPathTree(beginLoc, SPECS.UNITS[RUSH_BOT].SPEED, this.map, {state: this});
        //  }
          // catch(err) {
          //   this.log("Error caught around line 40!!!")
          //   this.log("this.startingConnectedComponents: " + JSON.stringify(this.startingConnectedComponents));
          // }
          if(this.startingConnectedComponents[1].length !== 0) {
            try {
              var offsetToUse = [this.startingConnectedComponents[1][0][0], this.startingConnectedComponents[1][0][1]];
              var beginLoc = myLoc.addOffset(offsetToUse);
              this.secondCCshortestPathTree = navigation.makeShortestPathTree(beginLoc, SPECS.UNITS[RUSH_BOT].SPEED, this.map);
            }
            catch(err) {
              this.log("ERROR ERROR ERROR!");
            }
            secondCCListofLocsByCloseness = navigation.getLocsByCloseness(this.secondCCshortestPathTree, attackingLocations);
          }
          var firstCCListofLocsByCloseness = navigation.getLocsByCloseness(this.firstCCshortestPathTree, attackingLocations);
          var secondCCListofLocsByCloseness = (this.startingConnectedComponents[1].length !== 0) ? navigation.getLocsByCloseness(this.secondCCshortestPathTree, attackingLocations) : null;
          if((secondCCListofLocsByCloseness == null) || (secondCCListofLocsByCloseness[0][1] == Number.POSITIVE_INFINITY)) {
            if(firstCCListofLocsByCloseness[0][1] != Number.POSITIVE_INFINITY) {
              this.mode = MODE.SPAWN;
              this.spawn_list = this.startingConnectedComponents[0];
            }
            else {
              this.mode = MODE.DO_NOTHING;
            }
          }
          else {
            if(firstCCListofLocsByCloseness[0][1] == Number.POSITIVE_INFINITY) {
              this.mode = MODE.SPAWN;
              this.spawn_list = this.startingConnectedComponents[1];
            }
            else {
              this.mode = MODE.SPAWN;
              this.spawn_list = (firstCCListofLocsByCloseness[0][1] < secondCCListofLocsByCloseness[0][1]) ? this.startingConnectedComponents[0] : this.startingConnectedComponents[1];
            }
          }
        }
        //this.log("this.mode is " + this.mode);
        //this.log("this.spawn_list is " + JSON.stringify(this.spawn_list));
        if(this.mode == MODE.SPAWN) {
          for (var i = 0; i < this.spawn_list.length; i++) {
            var offset = this.spawn_list[i];
            if (navigation.idAtOffset(offset, this) == 0) {
              //this.log("Building rush unit @ offset: " + JSON.stringify(offset));
              return this.buildUnit(RUSH_BOT, offset[1], offset[0]);
            }
          }
          //this.log("All offsets in spawn_list are occupied");
          return null; //all adjacent occupied
        }
        if(this.mode == MODE.DO_NOTHING) {
          //this.log("In do nothing mode, so doing nothing.");
          return null;
        }
        //---------------------SINGE PILGRIM CODE-------------------------------------------------
        //this.log("My corresponding enemy castle is at: " + JSON.stringify(navigation.reflectLocation(new Location(this.me.y, this.me.x), this.map.length, this.symmetryType)));
        // var audibleRobots = this.getVisibleRobots();
        // var hearingSignal = false;
        // if(this.me.turn === 1 ) {
        //   for(var i = 0; i < audibleRobots.length; i++) {
        //     var robot = audibleRobots[i];
        //     if(robot.id !== this.me.id && robot.castle_talk == 1) {
        //       hearingSignal = true;
        //       this.log("I am hearing a signal");
        //       return null;
        //     }
        //   }
        //   //this.log("Not hearing signal.");
        //   if(!hearingSignal) {
        //     this.castleTalk(1);
        //     var diagonalFound = false;
        //     var diagonalIndex = 0;
        //     for(; diagonalIndex <= 3; diagonalIndex++) {
        //       if(this.map[this.me.y + DIAGONALS[diagonalIndex][0]][this.me.x + DIAGONALS[diagonalIndex][1]]) {
        //         diagonalFound = true;
        //         break;
        //       }
        //     }
        //     if(diagonalFound) {
        //       this.log("Found an unoccupied diagonal; building pilgrim in: " + JSON.stringify(DIAGONALS[diagonalIndex]));
        //       return this.buildUnit(SPECS.PILGRIM, DIAGONALS[diagonalIndex][1], DIAGONALS[diagonalIndex][0]);
        //     }
        //     else {
        //       this.log("All diagonals are occupied");
        //     }
        //   }
        // }
        //---------------------SINGE PILGRIM CODE-------------------------------------------------
        break;
      case SPECS.CHURCH:
        this.log("Church. Turn: " + this.me.turn);
        if(this.me.turn == 1) {
          robotFunctions.rememberBuildableOffsets(this);
          robotFunctions.rememberStartingConnectedComponents(this, this.buildableOffsets); //TODO remove if buggy
        }
        break;
      case SPECS.PILGRIM:
        this.log("Pilgrim. Turn: " + this.me.turn);
        //TODO: generalize to nearest fuel and nearest karb function
        //TODO: consider going to second nearest and stuff
        //--------------------------PILGRIM MOVE TO NEAREST KARBONITE ---------------------
        // if(this.me.turn === 1) {
        //   this.shortestPathTree = navigation.makeShortestPathTree(new Location(this.me.y, this.me.x), SPECS.UNITS[SPECS.PILGRIM].SPEED, this.map);
        //   this.karbCosts = [];
        //   for(var i = 0; i < this.karbList.length; i++) {
        //     var karbLoc = this.karbList[i];
        //     this.karbCosts.push(this.shortestPathTree[karbLoc[0]][karbLoc[1]][0]);
        //   }
        //   var minKarbIndex = utilities.getMinIndex(this.karbCosts);
        //   var nearestKarbCoords = this.karbList[minKarbIndex];
        //   this.log("Coordinates of nearest karbonite are: " + JSON.stringify(nearestKarbCoords));
        //WARNING: getReversePathTo has been changed to getPathTo and is no longer reversed. Also, it can return null
        //   this.reversePathToNearestKarb = navigation.getReversePathTo(this.shortestPathTree, new Location(this.me.y, this.me.x), new Location(this.karbList[minKarbIndex][0], this.karbList[minKarbIndex][1]));
        //   this.log("The reverse path to nearest karbonite is: ");
        //   this.log(JSON.stringify(this.reversePathToNearestKarb));
        //   this.moveToDo = this.reversePathToNearestKarb.length - 1;
        // }
        // if(this.moveToDo >= 0) {
        //   this.log("doing move: " + JSON.stringify(this.reversePathToNearestKarb[this.moveToDo]));
        //   var dy = this.reversePathToNearestKarb[this.moveToDo][0];
        //   var dx = this.reversePathToNearestKarb[this.moveToDo][1];
        //   this.moveToDo -= 1;
        //   return this.move(dx, dy);
        // }
        // else {
        //   return null;
        // }
        //--------------------------PILGRIM MOVE TO NEAREST KARBONITE ---------------------
        break;
      case SPECS.CRUSADER:
        this.log("Crusader. Turn: " + this.me.turn);
        this.log("My id is: " + this.me.id);
        this.spawnedFrom = null; //TODO reprogram to take into account churches
        if(this.me.turn == 1) {
          for(var i = 0; i < ADJACENT.length; i++) {
            var offset = ADJACENT[i];
            var id = navigation.idAtOffset(offset, this);
            if(id > 0) {
              var bot = this.getRobot(id);
              if(bot.unit == SPECS.CASTLE && bot.team == this.me.team) {
                this.spawnedFrom = new Location(bot.y, bot.x);
                break;
              }
            }
          }
          this.log("Crusader turn 1, myLoc: " + JSON.stringify(myLoc) + " this.spawnedFrom is: " + JSON.stringify(this.spawnedFrom));
          this.targetCastleLoc = navigation.reflectLocation(this.spawnedFrom, this.map.length, this.symmetryType);
          this.log("Target Castle Loc is: " + JSON.stringify(this.targetCastleLoc));
          this.targetSquares = attacker.attackableFrom(this.targetCastleLoc, SPECS.CRUSADER, this.map); //locs
          this.log("Target Castle is attackable from: " + JSON.stringify(this.targetSquares));
          var costs = navigation.makeShortestPathTree(myLoc, SPECS.UNITS[SPECS.CRUSADER].SPEED, this.map);
          this.targetSquaresByCloseness = navigation.getLocsByCloseness(costs, this.targetSquares);
          if(this.targetSquaresByCloseness[0][1] == Number.POSITIVE_INFINITY) {
            this.mode = MODE.PATROL;
          }
          else {
            var targets = [];
            this.targetSquaresByCloseness.forEach(function(stuff) { //stuff = [[loc, cost], [loc, cost]]
              targets.push(stuff[0]);
            }.bind(this));
            this.mode = MODE.GO_TO_TARGET;
            this.targetList = targets;
            this.currentTargetIndex = 0;
            this.pathToTarget = navigation.getPathTo(costs, myLoc, this.targetList[this.currentTargetIndex]);
            this.numMoveToMake = 0;
            this.log("targetList, now sorted by closeness is: " + JSON.stringify(this.targetList));
            this.log("pathToTarget is: " + JSON.stringify(this.pathToTarget));
            if(this.pathToTarget == null) {
              this.log("ERROR ERROR ERROR");
            }
          }
        }
        //After turn 1 setup, before anything else (i.e. in all modes)
        var attackable = attacker.getAttackableRobots(this);
        if(attackable.length > 0) {
          this.log("My Loc is: " + JSON.stringify(myLoc));
          attacker.prioritizeAttackableByUnit(attackable)
          this.log("There are units I can attack. Prioritized by unit, they are: ");
          this.log(JSON.stringify(attackable));
          return this.attack(attackable[0].x - this.me.x, attackable[0].y - this.me.y);
        }
        if(this.mode == MODE.PATROL) {
          //TODO patrol code
          this.log("Crusader @ " + JSON.stringify(myLoc) + " and is in patrol mode");
          return null;
        }
        if(this.mode == MODE.WAIT) {
          return null; //TODO: Implement
        }
        if(this.mode == MODE.GO_TO_TARGET) {
          // this.log("Crusader @ " + JSON.stringify(myLoc) + " and is in GO_TO_TARGET mode");
          // this.log("targetList: " + JSON.stringify(this.targetList));
          // this.log("currentTargetIndex is: " + JSON.stringify(this.currentTargetIndex));
          // this.log("pathToTarget is: " + JSON.stringify(this.pathToTarget));
          // this.log("numMoveToMake this turn: " + JSON.stringify(this.numMoveToMake));
          // this.log("location I'd be in if I made this move: " + JSON.stringify(myLoc.addOffset(this.pathToTarget[this.numMoveToMake])));
          var moveToMake = this.pathToTarget[this.numMoveToMake];
          var idAtMove = navigation.idAtOffset(moveToMake, this);
          var botAtMove;
          if(idAtMove > 0) {
            // this.log("There is a robot at the loc I wish to move to, which is: " + JSON.stringify(myLoc.addOffset(this.pathToTarget[this.numMoveToMake])));
            botAtMove = this.getRobot(idAtMove);
            var friendlyAtMove = (botAtMove.team == this.me.team);
            if(friendlyAtMove) {
              // this.log("The aforementioned bot is friendly");
              if(this.numMoveToMake == this.pathToTarget.length - 1) { //were about to move to target and is blocked by friendly bot
                // this.log("My loc is: " + JSON.stringify(myLoc) + " and I was about to move to end (meaning attacker) target: " + JSON.stringify(myLoc.addOffset(moveToMake)) + " and it was blocked by friendly bot");
                // this.log("Am now considering new attacker target");
                var lookingForTarget = true;
                while(lookingForTarget) {
                  this.currentTargetIndex += 1;
                  if(this.currentTargetIndex >= this.targetList.length) {
                    // this.log("All locs from which to attack enemy castle were surrounded by friendlies; switching to patrol");
                    this.mode = MODE.PATROL; //TODO: make switchToPatrol (and other modes) function, make patrol mode
                    return null; //or break out of looking for target and do something else?
                  }
                  var potentialTargetLoc = this.targetList[this.currentTargetIndex];
                  try {
                    var idAtPotentialTarget = navigation.idAtOffset([potentialTargetLoc.y - myLoc.y, potentialTargetLoc.x - myLoc.x], this);
                  }
                  catch (err) {
                    this.log("caught err WTF??? See line 238");
                  }
                  //if potential target is visible and no robot there or invisible, go there.
                  //if robot there and enemy, start heading there. //TODO consider staying out of its attack radius
                  if( (idAtPotentialTarget <= 0) || (this.getRobot(idAtPotentialTarget).team != this.me.team)) {
                    // this.log("Going to new target @ " + JSON.stringify(potentialTargetLoc));


            //---------------------------------COPIED---------------------------------------------------------------
                    var movableOffsets = navigation.getMovableOffsets(myLoc, navigation.getOffsetsInRange(SPECS.UNITS[SPECS.CRUSADER].SPEED), this.map);
                    var forbiddenLocs = []; //make list of locations can't go to for costs tree
                    movableOffsets.forEach(function(offset) {
                      var id = navigation.idAtOffset(offset, this);
                      if((id > 0) && (this.getRobot(id).team == this.me.team)) { //if there is a friendly bot on that square
                        forbiddenLocs.push(myLoc.addOffset(offset));
                      }
                    }.bind(this));
                    // this.log("Places that I could move to but have friendly bots on them: ");
                    // this.log(JSON.stringify(forbiddenLocs));
                    var costs = navigation.makeShortestPathTree(myLoc, SPECS.UNITS[SPECS.CRUSADER].SPEED, this.map, {forbiddenLocs: forbiddenLocs});
                    this.pathToTarget = navigation.getPathTo(costs, myLoc, potentialTargetLoc);
                    this.numMoveToMake = 1;
                    // this.log("New path to target is: " + JSON.stringify(this.pathToTarget));
                    if(this.pathToTarget == null) {
                      // this.log("My Loc is: " + JSON.stringify(myLoc) + "and all paths to target blocked by friendly robots");
                      this.mode = MODE.WAIT; //TODO: context switch here; remember old state.
                      return null; //waiting??? Or switch to patrol? Or what?? TODO: something intelligent
                    }
                    if(this.pathToTarget.length == 1) {
                      // this.log("Reaching target after this move; switching to patrol mode");
                      this.mode = MODE.PATROL;
                    }
                    return this.move(this.pathToTarget[0][1], this.pathToTarget[0][0]);
            //---------------------------------COPIED---------------------------------------------------------------
                  }
                }
              }

              else { //friendly bot where I want to move, but weren't about to move to target
              //recalculate path, without stepping on friendly robots within moving radius
              //set up mode variables and make the move
              // this.log("There is a friendly bot where I was about to move, but it wasn't an end target. recalculating path");
//---------------------------------COPIED---------------------------------------------------------------
              //TODO: Make function friendsICanMoveTo (to keep out of costs tree)---------------------
                var movableOffsets = navigation.getMovableOffsets(myLoc, navigation.getOffsetsInRange(SPECS.UNITS[SPECS.CRUSADER].SPEED), this.map);
                var forbiddenLocs = []; //make list of locations can't go to for costs tree
                movableOffsets.forEach(function(offset) {
                  var id = navigation.idAtOffset(offset, this);
                  if((id > 0) && (this.getRobot(id).team == this.me.team)) { //if there is a friendly bot on that square
                    forbiddenLocs.push(myLoc.addOffset(offset));
                  }
                }.bind(this));
              //TODO: Make function friendsICanMoveTo (to keep out of costs tree)---------------------
                var costs = navigation.makeShortestPathTree(myLoc, SPECS.UNITS[SPECS.CRUSADER].SPEED, this.map, {forbiddenLocs: forbiddenLocs});
                this.pathToTarget = navigation.getPathTo(costs, myLoc, this.targetList[this.currentTargetIndex]); //WARNING: this line not copied
                this.numMoveToMake = 1;
                // this.log("My new path to target: " + JSON.stringify(this.targetList[this.currentTargetIndex]) + "is: ");
                // this.log(JSON.stringify(this.pathToTarget));
                if(this.pathToTarget == null) {
                  // this.log("My Loc is: " + JSON.stringify(myLoc) + " and Path to target " + JSON.stringify(this.targetList[this.currentTargetIndex]) + " blocked by friendly robots");
                  this.mode = MODE.WAIT; //TODO: context switch here; remember old state.
                  return null; //waiting??? Or switch to patrol? Or what?? TODO: something intelligent
                }
                if(this.pathToTarget.length == 1) {
                  // this.log("Reaching target after this move; switching to patrol mode");
                  this.mode = MODE.PATROL;
                }
                return this.move(this.pathToTarget[0][1], this.pathToTarget[0][0]);
  //---------------------------------COPIED---------------------------------------------------------------
              }


            }
            else { //there's a bot where I want to move, but it's enemy bot
              throw "WTH? Shouldn't I have attacked this? Enemy at place I want to move.";
              return null;
            }
          }

          else { //there is no bot where I want to move
            //TODO: consider doing something else if can see enemy bot outside your
            //      own attack radius and you are about to step into its attack radius
            // this.log("There is no bot where I want to move.");
            this.numMoveToMake += 1;
            // this.log("The next numMoveToMake is: " + this.numMoveToMake);
            if(this.numMoveToMake == this.pathToTarget.length) { //TODO: correct index???
              this.log("WILL HAVE REACHED target after making this move; switching to patrol mode"); //TODO: make switching to mode functions
              this.mode = MODE.PATROL; //NOTE: do not return here; still need to make this move
            }
            this.log("Making move: dx: " + moveToMake[1] + " dy: " + moveToMake[0]);
            return this.move(moveToMake[1], moveToMake[0]);
          }
        }
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
const DIRECT_ADJACENT = [NORTH, EAST, SOUTH, WEST];
const DIAGONALS = [NORTHEAST, SOUTHEAST, SOUTHWEST, NORTHWEST];
const ADJACENT = [NORTH, NORTHEAST, EAST, SOUTHEAST, SOUTH, SOUTHWEST, WEST, NORTHWEST];

const RUSH_BOT = SPECS.CRUSADER;
const MODE = {
  SPAWN: 0,
  DO_NOTHING: 1,
  GO_TO_TARGET: 2,
  PATROL: 3,
  WAIT: 4 //currently this does nothing. TODO: implement state machine remembrance and switching and context
          //TODO consider moving around randomly a bit during waiting. Or maybe patrolling a bit.
}

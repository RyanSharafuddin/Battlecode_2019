import {BCAbstractRobot, SPECS} from 'battlecode';
import {Queue} from './Queue.js';
import {Location} from './Location.js';
import * as utilities from './utilities.js'
import * as navigation from './navigation.js'
import * as robotFunctions from './robotFunctions.js'
import * as attacker from './attacker.js'
import * as castle from './castle.js'
import * as CONSTANTS from './universalConstants.js'
import * as crusader from './crusader.js'


class MyRobot extends BCAbstractRobot {
//TODO: perhaps have castles and churches keep track of and tell units their order in turn queue??
//WARNING: if this function screws with the game, delete it.
  log(message) {
          this._bc_logs.push(message);
  }

  turn() {
    robotFunctions.allRobotRememberStuff(this);
    this.myLoc = new Location(this.me.y, this.me.x);

    switch (this.me.unit) {
      case SPECS.CASTLE:
        this.log("Castle. Turn: " + this.me.turn);
        castle.castleInitialize(this);
        //this.log("this.mode is " + this.mode);
        if(this.mode == CONSTANTS.MODE.SPAWN) {
          for (var i = 0; i < this.spawn_list.length; i++) {
            var offset = this.spawn_list[i];
            if (navigation.idAtOffset(offset, this) == 0) {
              //this.log("Building rush unit @ offset: " + JSON.stringify(offset));
              return this.buildUnit(CONSTANTS.RUSH_BOT, offset[1], offset[0]);
            }
          }
          //this.log("All offsets in spawn_list are occupied");
          return null; //all adjacent occupied
        }

        if(this.mode == CONSTANTS.MODE.DO_NOTHING) {
          //this.log("In do nothing mode, so doing nothing.");
          return null;
        }

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
        break;


      case SPECS.CRUSADER:
        this.log("Crusader. Turn: " + this.me.turn + " Location: " + this.myLoc);
        crusader.crusaderInitialize(this);
        //After turn 1 setup, before anything else (i.e. in all modes)
        var attackable = attacker.getAttackablePrioritizedByUnit(this);
        if(attackable.length > 0) {
          return this.attack(attackable[0].x - this.me.x, attackable[0].y - this.me.y);
        }
        if(this.mode == CONSTANTS.MODE.PATROL) {
          //TODO patrol code
          this.log("Rusher @ " + JSON.stringify(this.myLoc) + " and is in patrol mode");
          return null;
        }
        if(this.mode == CONSTANTS.MODE.WAIT) {
          return null; //TODO: Implement
        }
        if(this.mode == CONSTANTS.MODE.GO_TO_TARGET) {
          var moveToMake = this.pathToTarget[this.numMoveToMake]; //WARNING see robotFunctions
          var idAtMove = navigation.idAtOffset(moveToMake, this);
          var botAtMove;
          if(idAtMove > 0) { //bot at place I want to move
            botAtMove = this.getRobot(idAtMove);
            var friendlyAtMove = (botAtMove.team === this.me.team);
            if(friendlyAtMove) {
              if(this.numMoveToMake == this.pathToTarget.length - 1) {
                //were about to move to target and is blocked by friendly bot
                 var potentialTargetLoc = robotFunctions.getNextOpenTarget(this, this.stats.SPEED);
                 if(potentialTargetLoc == null) {
                   this.mode = CONSTANTS.MODE.PATROL; //TODO consider waiting?
                   return null;
                 }
                 else {
                   return robotFunctions.setNewPath(this, SPECS.UNITS[this.me.unit].SPEED, potentialTargetLoc);
                 }
              }

              else { //friendly bot where I want to move, but weren't about to move to target
                return robotFunctions.setNewPath(this, SPECS.UNITS[this.me.unit].SPEED, this.targetList[this.currentTargetIndex]);
              }
            }
            else { //there's a bot where I want to move, but it's enemy bot
              throw "WTH? Shouldn't I have attacked this? Enemy at place I want to move.";
              return null;
            }
          }

          else { //there is no bot where I want to move
            return robotFunctions.vanillaMove(this);
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

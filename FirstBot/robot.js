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
        return castle.castleTurn(this);
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
        return robotFunctions.rusherTurn(this);
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

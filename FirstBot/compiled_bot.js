'use strict';

var SPECS = {"COMMUNICATION_BITS":16,"CASTLE_TALK_BITS":8,"MAX_ROUNDS":1000,"TRICKLE_FUEL":25,"INITIAL_KARBONITE":100,"INITIAL_FUEL":500,"MINE_FUEL_COST":1,"KARBONITE_YIELD":2,"FUEL_YIELD":10,"MAX_TRADE":1024,"MAX_BOARD_SIZE":64,"MAX_ID":4096,"CASTLE":0,"CHURCH":1,"PILGRIM":2,"CRUSADER":3,"PROPHET":4,"PREACHER":5,"RED":0,"BLUE":1,"CHESS_INITIAL":100,"CHESS_EXTRA":20,"TURN_MAX_TIME":200,"MAX_MEMORY":50000000,"UNITS":[{"CONSTRUCTION_KARBONITE":null,"CONSTRUCTION_FUEL":null,"KARBONITE_CAPACITY":null,"FUEL_CAPACITY":null,"SPEED":0,"FUEL_PER_MOVE":null,"STARTING_HP":200,"VISION_RADIUS":100,"ATTACK_DAMAGE":10,"ATTACK_RADIUS":[1,64],"ATTACK_FUEL_COST":10,"DAMAGE_SPREAD":0},{"CONSTRUCTION_KARBONITE":50,"CONSTRUCTION_FUEL":200,"KARBONITE_CAPACITY":null,"FUEL_CAPACITY":null,"SPEED":0,"FUEL_PER_MOVE":null,"STARTING_HP":100,"VISION_RADIUS":100,"ATTACK_DAMAGE":0,"ATTACK_RADIUS":0,"ATTACK_FUEL_COST":0,"DAMAGE_SPREAD":0},{"CONSTRUCTION_KARBONITE":10,"CONSTRUCTION_FUEL":50,"KARBONITE_CAPACITY":20,"FUEL_CAPACITY":100,"SPEED":4,"FUEL_PER_MOVE":1,"STARTING_HP":10,"VISION_RADIUS":100,"ATTACK_DAMAGE":null,"ATTACK_RADIUS":null,"ATTACK_FUEL_COST":null,"DAMAGE_SPREAD":null},{"CONSTRUCTION_KARBONITE":15,"CONSTRUCTION_FUEL":50,"KARBONITE_CAPACITY":20,"FUEL_CAPACITY":100,"SPEED":9,"FUEL_PER_MOVE":1,"STARTING_HP":40,"VISION_RADIUS":49,"ATTACK_DAMAGE":10,"ATTACK_RADIUS":[1,16],"ATTACK_FUEL_COST":10,"DAMAGE_SPREAD":0},{"CONSTRUCTION_KARBONITE":25,"CONSTRUCTION_FUEL":50,"KARBONITE_CAPACITY":20,"FUEL_CAPACITY":100,"SPEED":4,"FUEL_PER_MOVE":2,"STARTING_HP":20,"VISION_RADIUS":64,"ATTACK_DAMAGE":10,"ATTACK_RADIUS":[16,64],"ATTACK_FUEL_COST":25,"DAMAGE_SPREAD":0},{"CONSTRUCTION_KARBONITE":30,"CONSTRUCTION_FUEL":50,"KARBONITE_CAPACITY":20,"FUEL_CAPACITY":100,"SPEED":4,"FUEL_PER_MOVE":3,"STARTING_HP":60,"VISION_RADIUS":16,"ATTACK_DAMAGE":20,"ATTACK_RADIUS":[1,16],"ATTACK_FUEL_COST":15,"DAMAGE_SPREAD":3}]};

function insulate(content) {
    return JSON.parse(JSON.stringify(content));
}

class BCAbstractRobot {
    constructor() {
        this._bc_reset_state();
    }

    // Hook called by runtime, sets state and calls turn.
    _do_turn(game_state) {
        this._bc_game_state = game_state;
        this.id = game_state.id;
        this.karbonite = game_state.karbonite;
        this.fuel = game_state.fuel;
        this.last_offer = game_state.last_offer;

        this.me = this.getRobot(this.id);

        if (this.me.turn === 1) {
            this.map = game_state.map;
            this.karbonite_map = game_state.karbonite_map;
            this.fuel_map = game_state.fuel_map;
        }

        try {
            var t = this.turn();
        } catch (e) {
            t = this._bc_error_action(e);
        }

        if (!t) t = this._bc_null_action();

        t.signal = this._bc_signal;
        t.signal_radius = this._bc_signal_radius;
        t.logs = this._bc_logs;
        t.castle_talk = this._bc_castle_talk;

        this._bc_reset_state();

        return t;
    }

    _bc_reset_state() {
        // Internal robot state representation
        this._bc_logs = [];
        this._bc_signal = 0;
        this._bc_signal_radius = 0;
        this._bc_game_state = null;
        this._bc_castle_talk = 0;
        this.me = null;
        this.id = null;
        this.fuel = null;
        this.karbonite = null;
        this.last_offer = null;
    }

    // Action template
    _bc_null_action() {
        return {
            'signal': this._bc_signal,
            'signal_radius': this._bc_signal_radius,
            'logs': this._bc_logs,
            'castle_talk': this._bc_castle_talk
        };
    }

    _bc_error_action(e) {
        var a = this._bc_null_action();
        
        if (e.stack) a.error = e.stack;
        else a.error = e.toString();

        return a;
    }

    _bc_action(action, properties) {
        var a = this._bc_null_action();
        if (properties) for (var key in properties) { a[key] = properties[key]; }
        a['action'] = action;
        return a;
    }

    _bc_check_on_map(x, y) {
        return x >= 0 && x < this._bc_game_state.shadow[0].length && y >= 0 && y < this._bc_game_state.shadow.length;
    }
    
    log(message) {
        this._bc_logs.push(JSON.stringify(message));
    }

    // Set signal value.
    signal(value, radius) {
        // Check if enough fuel to signal, and that valid value.

        if (this.fuel < Math.ceil(Math.sqrt(radius))) throw "Not enough fuel to signal given radius.";
        if (!Number.isInteger(value) || value < 0 || value >= Math.pow(2,SPECS.COMMUNICATION_BITS)) throw "Invalid signal, must be int within bit range.";
        if (radius > 2*Math.pow(SPECS.MAX_BOARD_SIZE-1,2)) throw "Signal radius is too big.";

        this._bc_signal = value;
        this._bc_signal_radius = radius;

        this.fuel -= radius;
    }

    // Set castle talk value.
    castleTalk(value) {
        // Check if enough fuel to signal, and that valid value.

        if (!Number.isInteger(value) || value < 0 || value >= Math.pow(2,SPECS.CASTLE_TALK_BITS)) throw "Invalid castle talk, must be between 0 and 2^8.";

        this._bc_castle_talk = value;
    }

    proposeTrade(karbonite, fuel) {
        if (this.me.unit !== SPECS.CASTLE) throw "Only castles can trade.";
        if (!Number.isInteger(karbonite) || !Number.isInteger(fuel)) throw "Must propose integer valued trade."
        if (Math.abs(karbonite) >= SPECS.MAX_TRADE || Math.abs(fuel) >= SPECS.MAX_TRADE) throw "Cannot trade over " + SPECS.MAX_TRADE + " in a given turn.";

        return this._bc_action('trade', {
            trade_fuel: fuel,
            trade_karbonite: karbonite
        });
    }

    buildUnit(unit, dx, dy) {
        if (this.me.unit !== SPECS.PILGRIM && this.me.unit !== SPECS.CASTLE && this.me.unit !== SPECS.CHURCH) throw "This unit type cannot build.";
        if (this.me.unit === SPECS.PILGRIM && unit !== SPECS.CHURCH) throw "Pilgrims can only build churches.";
        if (this.me.unit !== SPECS.PILGRIM && unit === SPECS.CHURCH) throw "Only pilgrims can build churches.";
        
        if (!Number.isInteger(dx) || !Number.isInteger(dx) || dx < -1 || dy < -1 || dx > 1 || dy > 1) throw "Can only build in adjacent squares.";
        if (!this._bc_check_on_map(this.me.x+dx,this.me.y+dy)) throw "Can't build units off of map.";
        if (this._bc_game_state.shadow[this.me.y+dy][this.me.x+dx] > 0) throw "Cannot build on occupied tile.";
        if (!this.map[this.me.y+dy][this.me.x+dx]) throw "Cannot build onto impassable terrain.";
        if (this.karbonite < SPECS.UNITS[unit].CONSTRUCTION_KARBONITE || this.fuel < SPECS.UNITS[unit].CONSTRUCTION_FUEL) throw "Cannot afford to build specified unit.";

        return this._bc_action('build', {
            dx: dx, dy: dy,
            build_unit: unit
        });
    }

    move(dx, dy) {
        if (this.me.unit === SPECS.CASTLE || this.me.unit === SPECS.CHURCH) throw "Churches and Castles cannot move.";
        if (!this._bc_check_on_map(this.me.x+dx,this.me.y+dy)) throw "Can't move off of map.";
        if (this._bc_game_state.shadow[this.me.y+dy][this.me.x+dx] === -1) throw "Cannot move outside of vision range.";
        if (this._bc_game_state.shadow[this.me.y+dy][this.me.x+dx] !== 0) throw "Cannot move onto occupied tile.";
        if (!this.map[this.me.y+dy][this.me.x+dx]) throw "Cannot move onto impassable terrain.";

        var r = Math.pow(dx,2) + Math.pow(dy,2);  // Squared radius
        if (r > SPECS.UNITS[this.me.unit]['SPEED']) throw "Slow down, cowboy.  Tried to move faster than unit can.";
        if (this.fuel < r*SPECS.UNITS[this.me.unit]['FUEL_PER_MOVE']) throw "Not enough fuel to move at given speed.";

        return this._bc_action('move', {
            dx: dx, dy: dy
        });
    }

    mine() {
        if (this.me.unit !== SPECS.PILGRIM) throw "Only Pilgrims can mine.";
        if (this.fuel < SPECS.MINE_FUEL_COST) throw "Not enough fuel to mine.";
        
        if (this.karbonite_map[this.me.y][this.me.x]) {
            if (this.me.karbonite >= SPECS.UNITS[SPECS.PILGRIM].KARBONITE_CAPACITY) throw "Cannot mine, as at karbonite capacity.";
        } else if (this.fuel_map[this.me.y][this.me.x]) {
            if (this.me.fuel >= SPECS.UNITS[SPECS.PILGRIM].FUEL_CAPACITY) throw "Cannot mine, as at fuel capacity.";
        } else throw "Cannot mine square without fuel or karbonite.";

        return this._bc_action('mine');
    }

    give(dx, dy, karbonite, fuel) {
        if (dx > 1 || dx < -1 || dy > 1 || dy < -1 || (dx === 0 && dy === 0)) throw "Can only give to adjacent squares.";
        if (!this._bc_check_on_map(this.me.x+dx,this.me.y+dy)) throw "Can't give off of map.";
        if (this._bc_game_state.shadow[this.me.y+dy][this.me.x+dx] <= 0) throw "Cannot give to empty square.";
        if (karbonite < 0 || fuel < 0 || this.me.karbonite < karbonite || this.me.fuel < fuel) throw "Do not have specified amount to give.";

        return this._bc_action('give', {
            dx:dx, dy:dy,
            give_karbonite:karbonite,
            give_fuel:fuel
        });
    }

    attack(dx, dy) {
        if (this.me.unit === SPECS.CHURCH) throw "Churches cannot attack.";
        if (this.fuel < SPECS.UNITS[this.me.unit].ATTACK_FUEL_COST) throw "Not enough fuel to attack.";
        if (!this._bc_check_on_map(this.me.x+dx,this.me.y+dy)) throw "Can't attack off of map.";
        if (this._bc_game_state.shadow[this.me.y+dy][this.me.x+dx] === -1) throw "Cannot attack outside of vision range.";

        var r = Math.pow(dx,2) + Math.pow(dy,2);
        if (r > SPECS.UNITS[this.me.unit]['ATTACK_RADIUS'][1] || r < SPECS.UNITS[this.me.unit]['ATTACK_RADIUS'][0]) throw "Cannot attack outside of attack range.";

        return this._bc_action('attack', {
            dx:dx, dy:dy
        });
        
    }


    // Get robot of a given ID
    getRobot(id) {
        if (id <= 0) return null;
        for (var i=0; i<this._bc_game_state.visible.length; i++) {
            if (this._bc_game_state.visible[i].id === id) {
                return insulate(this._bc_game_state.visible[i]);
            }
        } return null;
    }

    // Check if a given robot is visible.
    isVisible(robot) {
        return ('unit' in robot);
    }

    // Check if a given robot is sending you radio.
    isRadioing(robot) {
        return robot.signal >= 0;
    }

    // Get map of visible robot IDs.
    getVisibleRobotMap() {
        return this._bc_game_state.shadow;
    }

    // Get boolean map of passable terrain.
    getPassableMap() {
        return this.map;
    }

    // Get boolean map of karbonite points.
    getKarboniteMap() {
        return this.karbonite_map;
    }

    // Get boolean map of impassable terrain.
    getFuelMap() {
        return this.fuel_map;
    }

    // Get a list of robots visible to you.
    getVisibleRobots() {
        return this._bc_game_state.visible;
    }

    turn() {
        return null;
    }
}

class Queue {

  constructor(num) {
    this.items = new Array(num);
    this.head = 0;
    this.tail = 0;
  }

  isEmpty() {
    return (this.head === this.tail);
  }

  enqueue(item) {
    this.items[this.tail] = item;
    this.tail += 1;
  }

  dequeue() {
    var item = this.items[this.head];
    this.head += 1;
    return item;
  }

  peekFront() {
    return this.items[this.head];
  }

  numItems() {
    return (this.tail - this.head);
  }

  stringQueue() {
    return "Head: " + this.head + " Tail: " + this.tail + " Items: " + this.items.toString();
  }

}

class Location {

  constructor(y, x) {
    this.y = y;
    this.x = x;
  }

  equals(otherLoc) {
    return ( (this.y === otherLoc.y) && (this.x === otherLoc.x) );
  }

  addOffset(offset) {
    return (new Location(this.y + offset[0], this.x + offset[1]));
  }

  isInList(lst) {
    for(var i = 0; i < lst.length; i++) {
      if(this.equals(lst[i])) {
        return true;
      }
    }
    return false;
  }

  toString() {
    return "{y: " + this.y + " x: " + this.x + "}";
  }
}

function makeSquareGrid(length, fillValue) {
  var grid = [];
  var blankRow = new Array(length).fill(fillValue);
  for (var i = 0; i < length; i++) {
    grid.push(blankRow.slice()); //okay because array is shallow
  }
  return grid;
}

const OWN_TOSTRING_TABLE = [
  /* this is a list of names of my own classes that have implemented their
   * their own toString() method.
   */
   "Location",
];

function prettyHelper(obj, indent) {
  // https://stackoverflow.com/questions/130404/javascript-data-formatting-pretty-printer
  if(OWN_TOSTRING_TABLE.includes(obj.constructor.name)) {
    return obj.toString();
  }
  var result = "";
  if (indent == null) indent = "";

  for (var property in obj)
  {
    var value = obj[property];
    if (typeof value == 'string')
      value = "'" + value + "'";
    else if (typeof value == 'object')
    {
      if (value instanceof Array)
      {
        // Just let JS convert the Array to a string!
        value = "[ " + value + " ]";
      }
      else if (OWN_TOSTRING_TABLE.includes(value.constructor.name)) {
        value = value.toString();
      }
      else
      {
        // Recursive dump
        // (replace "  " by "\t" or something else if you prefer)
        var od = prettyHelper(value, indent + "  ");
        // If you like { on the same line as the key
        //value = "{\n" + od + "\n" + indent + "}";
        // If you prefer { and } to be aligned
        value = "\n" + indent + "{\n" + od + "\n" + indent + "}";
      }
    }
    result += indent + "'" + property + "': " + value + ",\n";
  }
  return result.replace(/,\n$/, "");
}

function pretty(obj, indent) {
  var s = prettyHelper(obj, indent);
  return("\n" + s);
}

const PILGRIM_MOVE = SPECS.UNITS[SPECS.PILGRIM].SPEED;
const MAX_BOTS = SPECS.MAX_ID;
const NORTH = [-1, 0];
const NORTHEAST = [-1, 1];
const EAST = [0, 1];
const SOUTHEAST = [1, 1];
const SOUTH = [1, 0];
const SOUTHWEST = [1, -1];
const WEST = [0, -1];
const NORTHWEST = [-1, -1];
const ADJACENT = [NORTH, NORTHEAST, EAST, SOUTHEAST, SOUTH, SOUTHWEST, WEST, NORTHWEST];

function getOffsetsInRange(movableRadius) {
  //given movableRadius, returns a list of [dy, dx] that can move
  //no regard to offmap or impassable or other robots.
    var offsetsInRange = [];
    var biggestStraightMove = 0;
    while ((biggestStraightMove + 1) ** 2 <= movableRadius) {
      biggestStraightMove += 1;
    }
    for (var xMove = -biggestStraightMove; xMove <= biggestStraightMove; xMove++) {
      for(var yMove = 0; (xMove ** 2) + (yMove ** 2) <= movableRadius; yMove++) {
        if( !((yMove === 0) && (xMove === 0)) ) {
          offsetsInRange.push([yMove, xMove]);
        }
        if(yMove !== 0) {
          offsetsInRange.push([-yMove, xMove]);
        }
      }
    }
    return offsetsInRange;
  }

  function getMovableOffsets(startLocation, offsetsInRange, map) {
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

    function makeShortestPathTree(startLocation, movableRadius, map, extras) {
        var q = new Queue(4096);
        q.enqueue(startLocation);
        var costs = makeSquareGrid(map.length, null);
        costs[startLocation.y][startLocation.x] = [0, null]; //costs[y][x] = [numMoves, offset to get here from previous]

        while(!q.isEmpty()) {
          var lookAt = q.dequeue();
          var movableOffsets = getMovableOffsets(lookAt, getOffsetsInRange(movableRadius), map);
          movableOffsets.forEach(function(offset) {
            var locationToExamine = new Location(lookAt.y + offset[0], lookAt.x + offset[1]);
            if( (extras) && (extras.forbiddenLocs != undefined) && locationToExamine.isInList(extras.forbiddenLocs)) {
              return; //like a continue for the movableOffsets for loop. see https://stackoverflow.com/questions/31399411/go-to-next-iteration-in-javascript-foreach-loop/31399448
            }
            if(costs[locationToExamine.y][locationToExamine.x] === null) {
              costs[locationToExamine.y][locationToExamine.x] = [costs[lookAt.y][lookAt.x][0] + 1, offset];
              q.enqueue(locationToExamine);
            }
          });
        }
        return costs;
      }

  function isReachable(shortestPathTree, endLoc) {
    return(shortestPathTree[endLoc.y][endLoc.x] != null);
  }

  function numMovesTo(shortestPathTree, endLoc) {
    if(shortestPathTree[endLoc.y][endLoc.x] == null) {
      return Number.POSITIVE_INFINITY;
    }
    return(shortestPathTree[endLoc.y][endLoc.x][0]);
  }

  function getLocsByCloseness(shortestPathTree, listOfLocs) {
    //relative to a starting location and a shortest path tree, returns a list
    //[[loc, cost], [loc, cost]] that is sorted by closeness
    var newList = [];
     for(var i = 0; i < listOfLocs.length; i++) {
       var loc = listOfLocs[i];
       (shortestPathTree[loc.y][loc.x] == null) ? newList.push([loc, Number.POSITIVE_INFINITY]) : newList.push([loc, shortestPathTree[loc.y][loc.x][0]]);
     }
     newList.sort(function(a, b) {
       if( a[1] == Number.POSITIVE_INFINITY && b[1] == Number.POSITIVE_INFINITY){
         return 0;
       }
       return(a[1] - b[1]);
     });
     return newList;
  }

  function compareRow(maps, firstRow, secondRow) {
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

  function compareColumn(maps, firstColumn, secondColumn) {
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

  function getSymmetry(maps) {
    //maps is [map, karbonite_map, fuel_map]
    var length = maps[0].length;
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

  function reflectLocation(toReflect, mapLength, symmetryType) {
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

  function idAtOffset(offset, state) {
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

  function isOffsetUnoccupied(offset, state) {
    var id = idAtOffset(offset, state);
    if(id == -1) {
      throw "error: offset is invisible or offmap"
    }
    return (id == 0);
  }

  var SymmetryEnum = {
    HORIZONTAL: 0,
    VERTICAL: 1,
    INDETERMINATE: 2
  };

function isOffsetInAttackingRange(offset, unit) {
  if(SPECS.UNITS[unit].ATTACK_RADIUS == null) {
    return false;
  }
  return( (offset[0]**2 + offset[1]**2 <= SPECS.UNITS[unit].ATTACK_RADIUS[1]) &&
  (offset[0]**2 + offset[1]**2 >= SPECS.UNITS[unit].ATTACK_RADIUS[0]) );
}

class RobotCache {
  constructor() {
    this.robots = new Array(MAX_BOTS).fill(null);
  }
  add(obj) {
    // expects {id: robot id, unit: SPECS.CASTLE (etc), team: (1 or 0)}
    this.robots[obj.id] = obj;
  }
  get(id) {
    return this.robots[id];
  }
  contains(id) {
    return(this.robots[id] !== null);
  }
}

function rememberBuildableOffsets(state) {
  //causes state.buildableOffsets to be a list of offsets available for building
  //in if no robot is occupying it
  state.buildableOffsets = getMovableOffsets(new Location(state.me.y, state.me.x), getOffsetsInRange(2), state.map);
}

function rememberStartingConnectedComponents(state, buildableOffsets) {
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

function initializeAll(state) {
  //remember symmetryType, karbLocs, fuelLocs
  if(state.me.turn == 1) {
    state.robotCache = new RobotCache();
    var costs = makeShortestPathTree(new Location(state.me.y, state.me.x), PILGRIM_MOVE, state.map);
    state.stats = SPECS.UNITS[state.me.unit];
    state.symmetryType = getSymmetry([state.map, state.karbonite_map, state.fuel_map]);
    state.karbLocs = [];
    state.fuelLocs = [];
    for(var y = 0; y < state.map.length; y++) {
      for (var x = 0; x < state.map.length; x++) {
        if(state.karbonite_map[y][x] && isReachable(costs, new Location(y,x))) {
          state.karbLocs.push(new Location(y, x));
        }
        if(state.fuel_map[y][x] && isReachable(costs, new Location(y,x))) {
          state.fuelLocs.push(new Location(y, x));
        }
      }
    }
  }
  //stuff to set every turn
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
      (robo.team == state.me.team) ? state.visibleFriends.push(robo) : state.visibleEnemies.push(robo);
      if( (robo.team != state.me.team) && isOffsetInAttackingRange([robo.y - state.me.y, robo.x - state.me.x], state.me.unit)) {
        state.attackableRobots.push(robo);
      }
    }
    if(state.isRadioing(robo)) {
        state.radioingRobots.push(robo);
    }
  }
}

  function setSpawnList(state) {
    var firstCCcloseness = numMovesTo(state.firstCCshortestPathTree, state.enemyCastles[0]);
    var secondCCcloseness = (state.startingConnectedComponents[1].length !== 0) ? numMovesTo(state.secondCCshortestPathTree, state.enemyCastles[0]) : Number.POSITIVE_INFINITY;
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

function buildingInitialize(state) {
  if(state.me.turn == 1) {
    //both turn 1
    rememberBuildableOffsets(state);
    rememberStartingConnectedComponents(state, state.buildableOffsets);

    var offsetToUse = [state.startingConnectedComponents[0][0][0], state.startingConnectedComponents[0][0][1]];
    var beginLoc = state.myLoc.addOffset(offsetToUse);
    state.firstCCshortestPathTree = makeShortestPathTree(beginLoc, PILGRIM_MOVE, state.map, {state: state});

    if(state.startingConnectedComponents[1].length !== 0) {
      var offsetToUse = [state.startingConnectedComponents[1][0][0], state.startingConnectedComponents[1][0][1]];
      var beginLoc = state.myLoc.addOffset(offsetToUse);
      state.secondCCshortestPathTree = makeShortestPathTree(beginLoc, PILGRIM_MOVE, state.map);
    }

    state.karbLocsOne = getLocsByCloseness(state.firstCCshortestPathTree, state.karbLocs);
    state.karbLocsTwo = (state.startingConnectedComponents[1].length !== 0) ? getLocsByCloseness(state.secondCCshortestPathTree, state.karbLocs) : [];

    state.fuelLocsOne = getLocsByCloseness(state.firstCCshortestPathTree, state.fuelLocs);
    state.fuelLocsTwo = (state.startingConnectedComponents[1].length !== 0) ? getLocsByCloseness(state.secondCCshortestPathTree, state.fuelLocs) : [];
    state.myCastles = [];
    state.enemyCastles = [];
    if(state.me.unit == SPECS.CASTLE) {
      //castle turn 1
      state.myCastles.push(state.myLoc);
      if(state.symmetryType != SymmetryEnum.INDETERMINATE) {
        state.enemyCastles.push(reflectLocation(state.myLoc, state.map.length, state.symmetryType));
        setSpawnList(state);
      }
    }
  }
  //both every turn
  state.unoccupiedBuildableOffsets = [];
  for(var i = 0; i < state.buildableOffsets.length; i++) {
    var offset = state.buildableOffsets[i];
    if(isOffsetUnoccupied(offset, state)) {
      state.unoccupiedBuildableOffsets.push(offset);
    }
  }
  if(state.me.unit == SPECS.CASTLE) {
    //castle every turn
    state.castleTalkingRobots = [];
    var visBots = state.getVisibleRobots();
    for(var i = 0; i < visBots.length; i++) {
      var bot = visBots[i];
      if(bot.castle_talk > 0) {
        state.castleTalkingRobots.push(bot);
      }
    }

  }
}

function nonBuildingInitialize(state) {
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
  var castleLoc = null;
  var churchLoc = null;
  for(var i = 0; i < ADJACENT.length; i++) {
    var offset = ADJACENT[i];
    var id = idAtOffset(offset, state);
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
    if(state.symmetryType != SymmetryEnum.INDETERMINATE) {
      state.enemyCastles.push(reflectLocation(castleLoc, state.map.length, state.symmetryType));
    }
  }
  else if(churchLoc) {
    state.spawnedLoc = churchLoc;
    state.spawnedLocIsCastle = false;
  }
}

function castleTurn(state) {
  if(state.me.turn == 1) {
    state.castleTalk(state.myLoc.y);
    if(state.castleTalkingRobots.length == 0) {
      state.log("I am the first castle");
    }
    for(var i = 0; i < state.castleTalkingRobots.length; i++) {
      var bot = state.castleTalkingRobots[i];
      state.myCastles.push(new Location(bot.castle_talk, -1));
      state.robotCache.add({id: bot.id, unit: SPECS.CASTLE, team: state.me.team, castleIndex: state.myCastles.length -1});
      state.log("Am adding id: " + bot.id + " for the first time.");
      state.log(pretty(state.myCastles));
    }
  }

  if(state.me.turn == 2) {
    state.castleTalk(state.myLoc.x);
    if(state.castleTalkingRobots.length == 0) {
      state.log("I am the only castle");
    }
    for(var i = 0; i < state.castleTalkingRobots.length; i++) {
      var bot = state.castleTalkingRobots[i];
      if(state.myCastles.length == 1) {
        state.log("I am the first castle");
      }
      if(state.robotCache.contains(bot.id)) { //seen this before, add its x coord
        var idx = state.robotCache.get(bot.id).castleIndex;
        state.myCastles[idx].x = bot.castle_talk;
        state.log("Am updating id: " + bot.id);
        state.log(pretty(state.myCastles));
      }
      else {
        state.myCastles.push(new Location(bot.castle_talk, -1));
        state.robotCache.add({id: bot.id, unit: SPECS.CASTLE, team: state.me.team, castleIndex: state.myCastles.length -1});
        state.log("Am adding id: " + bot.id + " for the first time.");
        state.log(pretty(state.myCastles));
      }
    }
  }
  if(state.me.turn == 3) {
    for(var i = 0; i < state.castleTalkingRobots.length; i++) {
      var bot = state.castleTalkingRobots[i];
      state.myCastles[state.robotCache.get(bot.id).castleIndex].x = bot.castle_talk;
      state.log("Am updating id: " + bot.id);
      state.log(pretty(state.myCastles));
    }
    state.log("I now know the locations of all my own castles. They are: " + pretty(state.myCastles));
  }
}

function pilgrimInitialize(state) {
  var costs = makeShortestPathTree(state.myLoc, SPECS.UNITS[SPECS.PILGRIM].SPEED, state.map);
  state.karbLocs = getLocsByCloseness(costs, state.karbLocs);
  state.fuelLocs = getLocsByCloseness(costs, state.fuelLocs);
}

class MyRobot extends BCAbstractRobot {
//TODO: perhaps have castles and churches keep track of and tell units their order in turn queue??
//WARNING: if this function screws with the game, delete it.
  log(message) {
          this._bc_logs.push(message);
  }

  turn() {
    initializeAll(this);
    this.log("myLoc: " + this.myLoc);

    switch (this.me.unit) {

      case SPECS.CASTLE:
        this.log("Castle. Turn: " + this.me.turn);
        buildingInitialize(this);
        return castleTurn(this);
        break;

      case SPECS.CHURCH:
        this.log("Church. Turn: " + this.me.turn);
        buildingInitialize(this);
        break;


      case SPECS.PILGRIM:
        this.log("Pilgrim. Turn: " + this.me.turn);
        nonBuildingInitialize(this);
        pilgrimInitialize(this);
        break;


      case SPECS.CRUSADER:
        this.log("Crusader. Turn: " + this.me.turn + " Location: " + this.myLoc);
        nonBuildingInitialize(this);
        // crusader.crusaderInitialize(this);
        // return robotFunctions.rusherTurn(this);
        break;

      case SPECS.PROPHET:
        this.log("Prophet. Turn: " + this.me.turn);
        nonBuildingInitialize(this);
        // robotFunctions.rusherInitialize(this);
        // return robotFunctions.rusherTurn(this);
        break;

      case SPECS.PREACHER:
        this.log("Preacher. Turn: " + this.me.turn);
        nonBuildingInitialize(this);
        // robotFunctions.rusherInitialize(this);
        // return robotFunctions.rusherTurn(this);
        break;
      default:
    }
  }

}

var robot = new MyRobot();

var robot = new MyRobot();

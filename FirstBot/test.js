class Queue {

  constructor(num) {
    this.items = new Array(num)
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

}

console.log("Testing!");

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

function getMovableOffsets(startLocation, offsetsInRange) {
  //returns a list of offsets can potentially move to
  //Takes into account passable, and off edge, but NOT if other robot is there
  //offsetsInRange from function getOffsetsInRange
  return offsetsInRange.filter(function(offset) {
    var yLoc = startLocation.y + offset[0];
    var xLoc = startLocation.x + offset[1];
    if( yLoc >= sideLength || yLoc < 0) {
      return false;
    }
    if( xLoc >= sideLength || xLoc < 0) {
      return false;
    }
    return map[yLoc][xLoc];
  });

}

function makeShortestPathTree(startLocation, movableRadius) {
  //perhaps optimize later to stop once found nearest karbonite/fuel
  //location is just [y, x]
  var q = new Queue(4096);
  q.enqueue(startLocation);
  var blankRow = new Array(sideLength);
  var costs = [];
  for (var i = 0; i < sideLength; i++) {
    costs.push(blankRow.slice());
  }
  costs[startLocation.y][startLocation.x] = [0, null]; //costs[y][x] = [numMoves, offset to get here from previous]
  // console.log("costs after pushing start: ");
  // console.log(costs);
  while(!q.isEmpty()) {
    // console.log("q is not empty.");
    var lookAt = q.dequeue();
    // console.log("lookAt is: " + JSON.stringify(lookAt));
    var movableOffsets = getMovableOffsets(lookAt, getOffsetsInRange(movableRadius));
    // console.log("Movable offsets are: " + JSON.stringify(movableOffsets));
    movableOffsets.forEach(function(offset) {
      var locationToExamine = new Location(lookAt.y + offset[0], lookAt.x + offset[1]);
      // console.log("locationToExamine is: " + JSON.stringify(locationToExamine));
      if(costs[locationToExamine.y][locationToExamine.x] === undefined) {
        // console.log("Have not written this down yet");
        costs[locationToExamine.y][locationToExamine.x] = [costs[lookAt.y][lookAt.x][0] + 1, offset];
        // console.log("Wrote it down: ");
        // console.log(costs);
        q.enqueue(locationToExamine);
      }
    });
  }
  console.log("Final costs: ");
  for(var row = 0; row < sideLength; row++) {
    console.log(JSON.stringify(costs[row]));
  }
  return costs;
}

function getReversePathTo(shortestPathTree, startLoc, endLoc) {
  var reversedDirectionList = [];
  var currentLoc = endLoc;
  while(!currentLoc.equals(startLoc)) {
    var offsetToGetHere = shortestPathTree[currentLoc.y][currentLoc.x][1];
    reversedDirectionList.push(offsetToGetHere);
    currentLoc = new Location(currentLoc.y - offsetToGetHere[0], currentLoc.x - offsetToGetHere[1]);
  }
  return reversedDirectionList;
}

var karbMap = undefined;
var fuelMap = undefined;
var map = [
  [true, true, true, true, true, true],
  [true, false, false, false, true, true],
  [true, true, true, false, true, true],
  [true, true, true, false, true, true],
  [true, true, true, false, true, true],
  [false, false, false, false, true, true]
];
var sideLength = 6;

console.log("Map: ")
console.log(map);
var tree = makeShortestPathTree(new Location(3, 1), 2);
console.log(JSON.stringify(getReversePathTo(tree, new Location(3, 1), new Location(4, 4))));

//console.log(getOffsetsInRange(1));
//console.log(getMovableOffsets(new Location(3, 1), getOffsetsInRange(1)))

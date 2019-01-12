import {Queue} from './Queue.js';
import {Location} from './Location.js';
import * as utilities from './utilities.js'
import * as navigation from './navigation.js'

export function rememberBuildableOffsets(state) {
  //causes this.buildableOffsets to be a list of offsets available for building
  //in if no robot is occupying it
  state.buildableOffsets = navigation.getMovableOffsets(new Location(state.me.y, state.me.x), navigation.getOffsetsInRange(2), state.map);
}

export function rememberStartingConnectedComponents(state, buildableOffsets) {
  //causes this.startingConnectedComponents to be an array of connected components.
  //if second array is empty, this means that there is 1 connected component
  // this.startingConnectedComponents = [[first component], [possibly empty]]
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
    //TODO: perhaps sort this by nearest to furthest from bot?
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

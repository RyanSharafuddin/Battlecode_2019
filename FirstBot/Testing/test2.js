import {Queue} from '../Queue.js';
import {Location} from '../Location.js';
import * as utilities from '../utilities.js'
import * as navigation from '../navigation.js'
import * as robotFunctions from '../robotFunctions.js'
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

var loc1 = new Location(3, 4);
var loc2 = new Location(3,4 );
var loc3 = new Location(3,5 );
console.log(loc1.equals(loc2));
console.log(loc1.equals(loc3));
var obj = { m: 1, arr: [1,2,3], arrarr: [[1,2], [1,2]], inner: {a:4}};
console.log(utilities.dump(obj));
console.log(utilities.dump(obj))

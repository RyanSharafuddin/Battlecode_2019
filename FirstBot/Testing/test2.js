import {Queue} from '../Queue.js';
import {Location} from '../Location.js';
import * as utilities from '../utilities.js'
import * as navigation from '../navigation.js'
import * as robotFunctions from '../robotFunctions.js'

var map1 = [
  [1, 1, 3],
  [1, 1, 3],
  [3, 3, 1]
];

var map2 = [
  [3, 3, 3],
  [3, 3, 3],
  [4, 4, 4,]
];

var map3 = [
  [1, 1, 3],
  [1, 1, 3],
  [6, 6, 6]
];

var maps = [map1, map2, map3];
console.log(navigation.compareColumn(maps, 0, 1));

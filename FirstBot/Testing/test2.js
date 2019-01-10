import {Queue} from '../Queue.js';
import {Location} from '../Location.js';
import * as utilities from '../utilities.js'
import * as navigation from '../navigation.js'

debugger;
var q = new Queue(10);
debugger;
q.enqueue(4);
debugger;
q.enqueue(5);
console.log(q.dequeue());
console.log(q.dequeue());
console.log(q.isEmpty());

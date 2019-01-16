export function getMinIndex(arr) {
  var minIndex = 0;
  for (var i = 1; i < arr.length; i++) {
    if(arr[i] < arr[minIndex]) {
      minIndex = i;
    }
  }
  return minIndex;
}

export function makeSquareGrid(length, fillValue) {
  var grid = [];
  var blankRow = new Array(length).fill(fillValue);
  for (var i = 0; i < length; i++) {
    grid.push(blankRow.slice()); //okay because array is shallow
  }
  return grid;
}

export function flattenFirst(lst) {
  //turns [[a, b], [a, b] . . .] into [a, a, a . . .] in the same order as original
  //useful to flatten the locs by closeness
  var answer = [];
  for(var i = 0; i < lst.length; i++) {
    answer.push(lst[i][0]);
  }
  return answer;
}

export function dump(obj, state) {
  state.log("{");
  for(var i = 0; i < Object.keys(obj).length;i++) {
    var key = Object.keys(obj)[i]
    state.log(key + ": " + JSON.stringify(obj[key]));
  }
  state.log("}");
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

export function pretty(obj, indent) {
  var s = prettyHelper(obj, indent);
  return("\n" + s);
}

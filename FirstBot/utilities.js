export function getMinIndex(arr) {
  var minIndex = 0;
  for (var i = 1; i < arr.length; i++) {
    if(arr[i] < arr[minIndex]) {
      minIndex = i;
    }
  }
  return minIndex;
}

export function dump(obj, state) {
  state.log("{");
  for(var i = 0; i < Object.keys(obj).length;i++) {
    var key = Object.keys(obj)[i]
    state.log(key + ": " + JSON.stringify(obj[key]));
  }
  state.log("}");
}

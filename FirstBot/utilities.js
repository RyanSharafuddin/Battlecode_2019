export function getMinIndex(arr) {
  var minIndex = 0;
  for (var i = 1; i < arr.length; i++) {
    if(arr[i] < arr[minIndex]) {
      minIndex = i;
    }
  }
  return minIndex;
}

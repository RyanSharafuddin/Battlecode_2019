export class Location {

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

export class Location {

  constructor(y, x) {
    this.y = y;
    this.x = x;
  }

  equals(otherLoc) {
    return ( (this.y === otherLoc.y) && (this.x === otherLoc.x) );
  }

}

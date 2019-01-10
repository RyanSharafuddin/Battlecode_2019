export class Queue {

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

export class CommandQueue {
  constructor() {
    this.commands = [];
  }

  push(cmd) {
    this.commands.push(cmd);
  }

  pop() {
    return this.commands.shift();
  }

  clear() {
    this.commands = [];
  }

  isEmpty() {
    return this.commands.length === 0;
  }
}
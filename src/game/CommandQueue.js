export class CommandQueue {
  constructor() {
    this.commands = [];
  }

  push(cmd) {
    this.commands.push(cmd);
  }

  insertFront(commands) {
    this.commands.unshift(...commands);
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

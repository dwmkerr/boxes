export class TerminatingWarning extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, TerminatingWarning.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

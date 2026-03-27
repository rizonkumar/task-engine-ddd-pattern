// WHY A BASE CLASS?
// Both TaskNotFoundException and DuplicateTitleException need:
//   - an error code (for the filter to read)
//   - a human message (for the API response)
//   - to be instanceof Error (so try/catch works)
//
// Instead of repeating this in every exception class,
// we put it in one base class and extend it.
//
// Notice: NO import from @nestjs or typeorm.
// This is still pure TypeScript.

export abstract class DomainException extends Error {
  constructor(
    public readonly errorCode: string,
    public readonly message: string,
  ) {
    super(message); // makes Error.message work
    this.name = this.constructor.name; // makes error.name = "TaskNotFoundException"
    Object.setPrototypeOf(this, new.target.prototype); // fixes instanceof in TypeScript
  }
}

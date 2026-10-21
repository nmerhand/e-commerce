export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super("An account already exists for this email");
    this.name = "EmailAlreadyRegisteredError";
  }
}

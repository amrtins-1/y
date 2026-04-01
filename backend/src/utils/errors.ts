export class ResourceNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResourceNotFoundException';
  }
}

export class InvalidCredentialsException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCredentialsException';
  }
}

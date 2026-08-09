/**
 * confana-node custom exceptions
 */

export class ConfanaError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class AuthError extends ConfanaError {}
export class SessionError extends ConfanaError {}
export class TTSError extends ConfanaError {}
export class ASRError extends ConfanaError {}
export class PhoneError extends ConfanaError {}

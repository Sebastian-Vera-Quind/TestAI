import { InsightError } from './InsightError';

export class UnauthorizedError extends InsightError {
  constructor(message: string) {
    super(message, 401);
    this.name = 'Unauthorized';
  }
}

export class UnauthenticatedError extends InsightError {
  constructor(username: string) {
    super(`User not authenticated: ${username}`, 401);
    this.name = 'Unauthenticated';
  }
}

import { InsightError } from './InsightError';

export class ForbiddenError extends InsightError {
  constructor(message: string) {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

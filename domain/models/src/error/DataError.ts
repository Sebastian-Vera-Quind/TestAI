import { InsightError } from './InsightError';

export class DataError extends InsightError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'DataError';
  }
}

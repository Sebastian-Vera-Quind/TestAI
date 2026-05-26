import { InsightError } from '.';

export class NotFoundError extends InsightError {
  constructor(entity: string, identifier: string) {
    super(`${entity} not found with ${identifier}.`, 404);
    this.name = `${entity}NotFound`;
  }
}

export class InsightError extends Error {
  private code: number = 500;

  constructor(message: string);
  constructor(message: string, code?: number);
  constructor(message: string, code?: number, parent?: Error) {
    if (parent) {
      super(message, { cause: parent });
    } else {
      super(message);
    }

    if (code !== undefined) {
      this.code = code;
    }
  }

  public getCode(): number {
    return this.code;
  }
}

export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly details: Record<string, unknown> | undefined;

  public constructor(
    statusCode: number,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

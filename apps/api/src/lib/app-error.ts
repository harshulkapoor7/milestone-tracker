// An error we throw on purpose, carrying the HTTP status the client should get.
// Example: throw new AppError(404, "NOT_FOUND", "Task not found")
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

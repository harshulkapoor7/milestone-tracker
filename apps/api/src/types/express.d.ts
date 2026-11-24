// Teach TypeScript that our middleware adds `userId` to every Express request.
import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}

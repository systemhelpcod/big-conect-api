import { UserRole } from "../../types/UserRole";

declare global {
  namespace Express {
    interface Request {
      user?: UserRole;
    }
  }
}

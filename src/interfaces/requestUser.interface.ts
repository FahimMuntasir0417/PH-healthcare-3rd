import { Role } from "../generated/prisma/enums";

export interface IRequestUser {
  userId: string;
  role: Role;
  name: string;
  email: string;
  status: string;
}

import "next-auth";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id?: string;
      roleId?: string;
      roleName?: string;
      permissions?: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    roleId?: string;
    roleName?: string;
    permissions?: string[];
  }
}

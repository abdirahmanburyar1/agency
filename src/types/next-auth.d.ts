import "next-auth";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id?: string;
      roleId?: string;
      roleName?: string;
      permissions?: string[];
      locationId?: string | null;
      branchId?: string | null;
      locationName?: string | null;
      branchName?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    roleId?: string;
    roleName?: string;
    permissions?: string[];
    locationId?: string | null;
    branchId?: string | null;
    locationName?: string | null;
    branchName?: string | null;
  }
}

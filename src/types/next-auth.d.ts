import "next-auth";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id?: string;
      tenantId?: string | null;
      roleId?: string;
      roleName?: string;
      permissions?: string[];
      isPlatformAdmin?: boolean;
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
    tenantId?: string | null;
    roleId?: string;
    roleName?: string;
    permissions?: string[];
    isPlatformAdmin?: boolean;
    locationId?: string | null;
    branchId?: string | null;
    locationName?: string | null;
    branchName?: string | null;
  }
}

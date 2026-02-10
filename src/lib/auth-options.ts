import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        tenantId: { label: "Tenant ID", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).toLowerCase();
        const tenantId = (credentials.tenantId as string) || DEFAULT_TENANT_ID;

        // Try platform admin first (tenantId is null)
        let user = await prisma.user.findFirst({
          where: {
            email,
            tenantId: null,
            isActive: true,
            isPlatformAdmin: true,
          },
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
            location: true,
            branch: true,
          },
        });

        if (!user) {
          // Try tenant user
          user = await prisma.user.findFirst({
            where: {
              email,
              tenantId,
              isActive: true,
            },
            include: {
              role: {
                include: {
                  permissions: { include: { permission: true } },
                },
              },
              location: true,
              branch: true,
            },
          });
        }

        if (!user) return null;

        const valid = await bcrypt.compare(
          String(credentials.password),
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
          roleId: user.roleId,
          roleName: user.role.name,
          permissions: user.role.permissions.map((rp) => rp.permission.code),
          isPlatformAdmin: user.isPlatformAdmin,
          locationId: user.locationId ?? null,
          branchId: user.branchId ?? null,
          locationName: user.location?.name ?? null,
          branchName: user.branch?.name ?? null,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id;
        token.tenantId = (user as { tenantId?: string | null }).tenantId ?? null;
        token.roleId = (user as { roleId?: string }).roleId;
        token.roleName = (user as { roleName?: string }).roleName;
        token.permissions = (user as { permissions?: string[] }).permissions ?? [];
        token.isPlatformAdmin = (user as { isPlatformAdmin?: boolean }).isPlatformAdmin ?? false;
        token.locationId = (user as { locationId?: string | null }).locationId ?? null;
        token.branchId = (user as { branchId?: string | null }).branchId ?? null;
        token.locationName = (user as { locationName?: string | null }).locationName ?? null;
        token.branchName = (user as { branchName?: string | null }).branchName ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { tenantId?: string | null }).tenantId = token.tenantId as string | null;
        (session.user as { roleId?: string }).roleId = token.roleId as string;
        (session.user as { roleName?: string }).roleName = token.roleName as string;
        (session.user as { permissions?: string[] }).permissions =
          (token.permissions as string[]) ?? [];
        (session.user as { isPlatformAdmin?: boolean }).isPlatformAdmin =
          (token.isPlatformAdmin as boolean) ?? false;
        (session.user as { locationId?: string | null }).locationId =
          (token.locationId as string | null) ?? null;
        (session.user as { branchId?: string | null }).branchId =
          (token.branchId as string | null) ?? null;
        (session.user as { locationName?: string | null }).locationName =
          (token.locationName as string | null) ?? null;
        (session.user as { branchName?: string | null }).branchName =
          (token.branchName as string | null) ?? null;
      }
      return session;
    },
  },
};

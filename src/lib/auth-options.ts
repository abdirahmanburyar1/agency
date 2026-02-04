import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: {
            email: String(credentials.email).toLowerCase(),
            isActive: true,
          },
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        });

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
          roleId: user.roleId,
          roleName: user.role.name,
          permissions: user.role.permissions.map((rp) => rp.permission.code),
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
        token.roleId = (user as { roleId?: string }).roleId;
        token.roleName = (user as { roleName?: string }).roleName;
        token.permissions = (user as { permissions?: string[] }).permissions ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { roleId?: string }).roleId = token.roleId as string;
        (session.user as { roleName?: string }).roleName = token.roleName as string;
        (session.user as { permissions?: string[] }).permissions =
          (token.permissions as string[]) ?? [];
      }
      return session;
    },
  },
};

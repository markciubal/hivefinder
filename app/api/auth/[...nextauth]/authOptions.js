import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { cleanUsername } from "@/lib/username";
import { findByUsername } from "@/lib/findUser";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = cleanUsername(credentials?.username);
        if (!username || !credentials?.password) return null;

        const user = await findByUsername(username, {
          id: true,
          username: true,
          password: true,
        });
        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isValid) return null;

        // No email field: NextAuth treats it as optional, and there is no
        // address to put in it.
        return { id: user.id, name: user.username };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        // 👇 NEW – expose role on session
        session.user.role = token.role || "MEMBER";
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        // 👇 NEW – load role from DB once at login and stash on token
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        token.role = dbUser?.role || "MEMBER";
      }
      return token;
    },
  },
  pages: {
    // Updated path to login page outside of [...nextauth] folder
    signIn: "/login",
    // You can also customize signOut, error, etc.
    // signOut: "/logout",
    // error: "/auth/error",
  },
};

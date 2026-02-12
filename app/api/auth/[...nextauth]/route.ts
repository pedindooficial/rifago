import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import Login2FAToken from "@/lib/models/Login2FAToken";
import { totpVerify } from "@/lib/totp";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
        twoFactorToken: { label: "Token 2FA", type: "text" },
        twoFactorCode: { label: "Código 2FA", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        await connectDB();

        const email = credentials.email.toLowerCase();

        if (credentials.twoFactorToken && credentials.twoFactorCode) {
          const tokenDoc = await Login2FAToken.findOne({
            token: credentials.twoFactorToken,
            expiresAt: { $gt: new Date() },
          }).lean();
          if (!tokenDoc) return null;

          const doc = tokenDoc as unknown as { userId: unknown };
          const user = await User.findById(doc.userId).select("+twoFactorSecret email name").lean();
          if (!user) return null;

          const u = user as unknown as { _id: { toString: () => string }; twoFactorSecret?: string; email: string; name: string };
          if (!u.twoFactorSecret) return null;

          const valid = await totpVerify(u.twoFactorSecret, credentials.twoFactorCode.replace(/\D/g, ""));
          if (!valid) return null;

          await Login2FAToken.deleteOne({ token: credentials.twoFactorToken });

          return {
            id: u._id.toString(),
            email: u.email,
            name: u.name,
          };
        }

        if (!credentials.password) return null;
        const user = await User.findOne({ email }).select("+password twoFactorEnabled").lean();
        if (!user) return null;
        const ok = await bcrypt.compare(credentials.password, (user as unknown as { password: string }).password);
        if (!ok) return null;

        const u = user as unknown as { _id: { toString: () => string }; email: string; name: string; twoFactorEnabled?: boolean };
        if (u.twoFactorEnabled) {
          return null;
        }

        return {
          id: u._id.toString(),
          email: u.email,
          name: u.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };

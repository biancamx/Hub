import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "./lib/mongodb-adapter";
import mongoose from "mongoose";
import { connectToDatabase } from "./lib/mongodb";
import { checkCredentials } from "./lib/credentials-auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("E-mail e senha são obrigatórios.");
        }

        const result = await checkCredentials(String(credentials.email), String(credentials.password));
        if (!result.success) throw new Error(result.error);
        return result.user;
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) return false;

        const cleanEmail = (user.email || "").toLowerCase().trim();
        const isTargetMaster = cleanEmail === "biancamoura.of@gmail.com";
        if (!cleanEmail) return false;

        const escapedEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const existingUser = await db.collection("users").findOne({
          email: { $regex: new RegExp(`^${escapedEmail}$`, "i") },
        });

        if (isTargetMaster) {
          await db.collection("users").updateOne(
            { email: cleanEmail },
            {
              $set: {
                name: user.name,
                image: user.image,
                role: "master",
                status: "active",
                failedLoginAttempts: 0,
                lockUntil: null,
              },
            },
            { upsert: true }
          );
          return true;
        }

        if (!existingUser) {
          await db.collection("users").insertOne({
            name: user.name,
            email: cleanEmail,
            image: user.image,
            role: "user",
            status: "pending",
            failedLoginAttempts: 0,
            lockUntil: null,
            createdAt: new Date(),
          });
          return "/login?error=PENDING_APPROVAL";
        }

        if (existingUser.status === "pending") {
          return "/login?error=PENDING_APPROVAL";
        }

        if (existingUser.status === "rejected") {
          return "/login?error=ACCOUNT_REJECTED";
        }

        if (existingUser.status === "active" || !existingUser.status) {
          return true;
        }
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      // No primeiro login
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email?.toLowerCase().trim();
        token.picture = user.image;
      }

      // Busca sempre o role atualizado no banco pelo email
      if (token.email) {
        try {
          await connectToDatabase();
          const db = mongoose.connection.db;
          if (db) {
            const dbUser = await db.collection("users").findOne({
              email: token.email,
            });
            if (dbUser) {
              token.role = dbUser.role || "user";
              token.status = dbUser.status || "active";
            }
          }
        } catch (error) {
          console.error("Erro ao sincronizar role no token:", error);
        }
      }

      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = (token.picture || token.image) as string;
        (session.user as any).role = token.role || "user";
        (session.user as any).status = token.status || "active";
      }
      return session;
    },
  },
});

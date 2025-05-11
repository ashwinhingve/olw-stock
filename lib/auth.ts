import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "./dbConnect";
import User from "@/models/user";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("No credentials provided");
          return null;
        }

        try {
          // Connect to MongoDB
          console.log("Connecting to MongoDB...");
          await dbConnect();
          console.log("Connected to MongoDB successfully");
          
          // Find user by email
          console.log(`Looking for user with email: ${credentials.email}`);
          const user = await User.findOne({ email: credentials.email }).select('+password');
          
          if (!user) {
            console.log("User not found");
            return null;
          }
          
          console.log("User found, checking password");
          
          // Check password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );
          
          if (!isPasswordValid) {
            console.log("Invalid password");
            return null;
          }
          
          console.log("Password valid, authentication successful");
          
          // Return user object without password
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role || 'user',
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'user';
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: true, // Always enable debug mode to see detailed errors
  logger: {
    error(code, metadata) {
      console.error(`Auth Error: ${code}`, metadata);
    },
    warn(code) {
      console.warn(`Auth Warning: ${code}`);
    },
    debug(code, metadata) {
      console.log(`Auth Debug: ${code}`, metadata);
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "default-secret-key-change-in-production",
};

// Helper function to check if the user is authenticated in API routes
export async function isAuthenticated(req: Request) {
  const session = await getServerSession(authOptions);
  return !!session;
}

// Import and re-export getServerSession to maintain consistency
import { getServerSession } from "next-auth";
export { getServerSession }; 
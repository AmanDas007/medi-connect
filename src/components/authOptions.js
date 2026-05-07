import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";

import connectDB from "@/db/connect";
import Patient from "@/models/Patient";
import Doctor from "@/models/Doctor";
import { findAccountByEmail } from "@/components/userLookup";

async function resolveOAuthUser({ email, name, image }) {
  const normalizedEmail = email.toLowerCase();

  const doctor = await Doctor.findOne({ email: normalizedEmail });

  if (doctor) {
    if (doctor.isBlocked) {
      throw new Error("Your doctor account is blocked");
    }

    return {
      id: doctor._id.toString(),
      role: "doctor",
      name: doctor.name,
      email: doctor.email,
      profileUrl: doctor.profileUrl,
      specialization: doctor.specialization,
    };
  }

  let patient = await Patient.findOne({ email: normalizedEmail });

  if (!patient) {
    patient = await Patient.create({
      role: "patient",
      name: name || "Patient",
      email: normalizedEmail,
      password: undefined,
      profileUrl: image || null,
      isBlocked: false,
    });
  } else if (!patient.profileUrl && image) {
    patient.profileUrl = image;
    await patient.save();
  }

  if (patient.isBlocked) {
    throw new Error("Your patient account is blocked");
  }

  return {
    id: patient._id.toString(),
    role: "patient",
    name: patient.name,
    email: patient.email,
    profileUrl: patient.profileUrl,
    specialization: null,
  };
}

export const authOptions = {
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        await connectDB();

        const email = credentials?.email?.toLowerCase();
        const password = credentials?.password;

        if (!email || !password) {
          throw new Error("Email and password are required");
        }

        const lookup = await findAccountByEmail(email);

        if (lookup.conflict) {
          throw new Error(lookup.message);
        }

        if (!lookup.user || !lookup.Model) {
          throw new Error("Invalid email or password");
        }

        const user = await lookup.Model.findOne({ email }).select("+password");

        if (!user) {
          throw new Error("Invalid email or password");
        }

        if (user.isBlocked) {
          throw new Error("Your account is blocked");
        }

        if (!user.password) {
          throw new Error("This account uses Google/GitHub login. Please use OAuth login.");
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user._id.toString(),
          role: user.role,
          name: user.name,
          email: user.email,
          profileUrl: user.profileUrl || null,
          specialization: user.specialization || null,
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      await connectDB();

      if (account.provider === "credentials") {
        return true;
      }

      if (!user.email) {
        return false;
      }

      try {
        await resolveOAuthUser({
          email: user.email,
          name: user.name,
          image: user.image,
        });

        return true;
      } catch (error) {
        console.error("OAuth signIn error:", error);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      await connectDB();

      if (account?.provider === "credentials" && user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email;
        token.profileUrl = user.profileUrl || null;
        token.specialization = user.specialization || null;

        return token;
      }

      if (account && account.provider !== "credentials" && token.email) {
        const resolvedUser = await resolveOAuthUser({
          email: token.email,
          name: token.name,
          image: token.picture,
        });

        token.id = resolvedUser.id;
        token.role = resolvedUser.role;
        token.name = resolvedUser.name;
        token.email = resolvedUser.email;
        token.profileUrl = resolvedUser.profileUrl || null;
        token.specialization = resolvedUser.specialization || null;

        return token;
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.profileUrl = token.profileUrl;
      session.user.specialization = token.specialization;

      return session;
    },
  },
};
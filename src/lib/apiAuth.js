import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./authOptions";

export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session?.user?.role) {
    return {
      error: NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  return {
    session,
    user: session.user,
  };
}

export async function requirePatient() {
  const auth = await requireAuth();

  if (auth.error) return auth;

  if (auth.user.role !== "patient") {
    return {
      error: NextResponse.json(
        { success: false, message: "Only patients can access this API" },
        { status: 403 }
      ),
    };
  }

  return auth;
}

export async function requireDoctor() {
  const auth = await requireAuth();

  if (auth.error) return auth;

  if (auth.user.role !== "doctor") {
    return {
      error: NextResponse.json(
        { success: false, message: "Only doctors can access this API" },
        { status: 403 }
      ),
    };
  }

  return auth;
}
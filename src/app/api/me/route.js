import { NextResponse } from "next/server";

import connectDB from "@/db/connect";
import Patient from "@/models/Patient";
import Doctor from "@/models/Doctor";
import { requireAuth } from "@/lib/apiAuth";

export async function GET() {
  try {
    await connectDB();

    const auth = await requireAuth();

    if (auth.error) return auth.error;

    let user = null;

    if (auth.user.role === "patient") {
      user = await Patient.findById(auth.user.id).select("-password");
    }

    if (auth.user.role === "doctor") {
      user = await Doctor.findById(auth.user.id).select("-password");
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    if (user.isBlocked) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is blocked",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          role: user.role,
          name: user.name,
          email: user.email,
          profileUrl: user.profileUrl || null,

          specialization: user.specialization || null,
          experienceYears: user.experienceYears ?? null,
          clinic: user.clinic || null,
          consultationFee: user.consultationFee ?? null,
          availability: user.availability || null,
          averageRating: user.averageRating ?? null,
          totalFeedbacks: user.totalFeedbacks ?? null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch me error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while fetching user",
      },
      { status: 500 }
    );
  }
}
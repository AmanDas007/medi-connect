import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/db/connect";
import Doctor from "@/models/Doctor";

export async function GET(req, { params }) {
  try {
    await connectDB();

    const { doctorId } = await params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid doctor id",
        },
        { status: 400 }
      );
    }

    const doctor = await Doctor.findOne({
      _id: doctorId,
      isBlocked: false,
    }).select(
      "name email profileUrl licenceUrl specialization experienceYears clinic consultationFee availability averageRating totalFeedbacks"
    );

    if (!doctor) {
      return NextResponse.json(
        {
          success: false,
          message: "Doctor not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        doctor,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch doctor by id error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while fetching doctor",
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import connectDB from "@/db/connect";
import Doctor from "@/models/Doctor";

export async function GET() {
  try {
    await connectDB();

    const doctors = await Doctor.find({ isBlocked: false })
      .select(
        "name email profileUrl specialization experienceYears clinic consultationFee availability averageRating totalFeedbacks"
      )
      .sort({
        averageRating: -1,
        totalFeedbacks: -1,
        createdAt: -1,
      });

    return NextResponse.json(
      {
        success: true,
        doctors,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch all doctors error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while fetching doctors",
      },
      { status: 500 }
    );
  }
}
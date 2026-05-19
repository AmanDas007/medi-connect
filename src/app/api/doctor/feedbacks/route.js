import { NextResponse } from "next/server";

import connectDB from "@/db/connect";
import DoctorFeedback from "@/models/DoctorFeedback";
import { requireDoctor } from "@/lib/apiAuth";

export async function GET(req) {
  try {
    await connectDB();

    const auth = await requireDoctor();
    if (auth.error) return auth.error;

    const doctorId = auth.user.id || auth.user._id;

    const { searchParams } = new URL(req.url);
    const rating = searchParams.get("rating") || "all";

    const baseQuery = {
      doctor: doctorId,
    };

    const feedbackQuery = {
      doctor: doctorId,
    };

    if (rating !== "all") {
      const ratingNumber = Number(rating);

      if (
        Number.isNaN(ratingNumber) ||
        ratingNumber < 1 ||
        ratingNumber > 5
      ) {
        return NextResponse.json(
          { success: false, message: "Invalid rating filter" },
          { status: 400 }
        );
      }

      feedbackQuery.rating = ratingNumber;
    }

    const allFeedbacks = await DoctorFeedback.find(baseQuery).lean();

    const feedbacks = await DoctorFeedback.find(feedbackQuery)
      .populate("patient", "name email profileUrl")
      .sort({ rating: -1, createdAt: -1 })
      .lean();

    const totalFeedbacks = allFeedbacks.length;

    const averageRating =
      totalFeedbacks > 0
        ? Number(
            (
              allFeedbacks.reduce((sum, item) => sum + item.rating, 0) /
              totalFeedbacks
            ).toFixed(1)
          )
        : 0;

    const ratingCounts = {
      5: allFeedbacks.filter(item => item.rating === 5).length,
      4: allFeedbacks.filter(item => item.rating === 4).length,
      3: allFeedbacks.filter(item => item.rating === 3).length,
      2: allFeedbacks.filter(item => item.rating === 2).length,
      1: allFeedbacks.filter(item => item.rating === 1).length,
    };

    return NextResponse.json(
      {
        success: true,
        feedbacks,
        stats: {
          totalFeedbacks,
          averageRating,
          ratingCounts,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Doctor feedbacks fetch error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while fetching feedbacks",
      },
      { status: 500 }
    );
  }
}
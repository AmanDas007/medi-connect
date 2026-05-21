import { NextResponse } from "next/server";

import connectDB from "@/db/connect";
import DoctorFeedback from "@/models/DoctorFeedback";
import { requireDoctor } from "@/lib/apiAuth";

function formatFeedback(feedback) {
  return {
    _id: feedback._id,
    rating: feedback.rating,
    comment: feedback.comment || "",
    createdAt: feedback.createdAt,
    patient: feedback.patient,
  };
}

export async function GET(req) {
  try {
    await connectDB();

    const auth = await requireDoctor();

    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);

    const rating = searchParams.get("rating") || "all";

    const requestedPage = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(
      30,
      Math.max(1, Number(searchParams.get("limit") || 6))
    );

    const statsDocs = await DoctorFeedback.find({
      doctor: auth.user.id,
    })
      .select("rating")
      .lean();

    const totalFeedbacks = statsDocs.length;

    const ratingCounts = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    let ratingSum = 0;

    statsDocs.forEach(item => {
      const value = Number(item.rating);

      if (value >= 1 && value <= 5) {
        ratingCounts[value] += 1;
        ratingSum += value;
      }
    });

    const averageRating =
      totalFeedbacks > 0 ? Number((ratingSum / totalFeedbacks).toFixed(1)) : 0;

    const query = {
      doctor: auth.user.id,
    };

    if (rating !== "all") {
      const ratingNumber = Number(rating);

      if (!Number.isInteger(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
        return NextResponse.json(
          { success: false, message: "Invalid rating filter" },
          { status: 400 }
        );
      }

      query.rating = ratingNumber;
    }

    const totalFilteredFeedbacks = await DoctorFeedback.countDocuments(query);

    const totalPages = Math.ceil(totalFilteredFeedbacks / limit);
    const page = totalPages > 0 ? Math.min(requestedPage, totalPages) : 1;
    const skip = (page - 1) * limit;

    const feedbackDocs = await DoctorFeedback.find(query)
      .populate("patient", "name email profileUrl")
      .sort({ rating: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const feedbacks = feedbackDocs.map(formatFeedback);

    return NextResponse.json(
      {
        success: true,
        feedbacks,
        stats: {
          totalFeedbacks,
          averageRating,
          ratingCounts,
        },
        pagination: {
          page,
          limit,
          totalFeedbacks: totalFilteredFeedbacks,
          totalPages,
          hasPrevPage: page > 1,
          hasNextPage: page < totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch doctor feedbacks error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while fetching feedbacks",
      },
      { status: 500 }
    );
  }
}
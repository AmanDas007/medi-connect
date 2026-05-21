import { NextResponse } from "next/server";

import connectDB from "@/db/connect";
import Doctor from "@/models/Doctor";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(
      30,
      Math.max(1, Number(searchParams.get("limit") || 9))
    );

    const search = searchParams.get("search")?.toString().trim() || "";

    const query = {
      isBlocked: false,
    };

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");

      query.$or = [
        { name: regex },
        { specialization: regex },
        { "clinic.name": regex },
        { "clinic.city": regex },
        { "clinic.state": regex },
        { "clinic.address": regex },
        { "clinic.pincode": regex },
      ];
    }

    const skip = (page - 1) * limit;

    const [totalDoctors, doctors] = await Promise.all([
      Doctor.countDocuments(query),

      Doctor.find(query)
        .select(
          "name email profileUrl specialization experienceYears clinic consultationFee averageRating totalFeedbacks availability isBlocked"
        )
        .sort({
          averageRating: -1,
          totalFeedbacks: -1,
          experienceYears: -1,
          name: 1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.ceil(totalDoctors / limit);

    return NextResponse.json(
      {
        success: true,
        doctors,
        pagination: {
          page,
          limit,
          totalDoctors,
          totalPages,
          hasPrevPage: page > 1,
          hasNextPage: page < totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get doctors error:", error);

    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
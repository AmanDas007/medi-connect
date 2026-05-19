import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import connectDB from "@/db/connect";
import Doctor from "@/models/Doctor";
import Appointment from "@/models/Appointment";
import DoctorFeedback from "@/models/DoctorFeedback";
import { authOptions } from "@/lib/authOptions";

function getUserIdFromSession(session) {
  return session?.user?.id || session?.user?._id || null;
}

async function recalculateDoctorRating(doctorId) {
  const result = await DoctorFeedback.aggregate([
    {
      $match: {
        doctor: new mongoose.Types.ObjectId(doctorId),
      },
    },
    {
      $group: {
        _id: "$doctor",
        averageRating: { $avg: "$rating" },
        totalFeedbacks: { $sum: 1 },
      },
    },
  ]);

  const stats = result[0];

  await Doctor.findByIdAndUpdate(doctorId, {
    averageRating: stats ? Number(stats.averageRating.toFixed(1)) : 0,
    totalFeedbacks: stats ? stats.totalFeedbacks : 0,
  });

  return {
    averageRating: stats ? Number(stats.averageRating.toFixed(1)) : 0,
    totalFeedbacks: stats ? stats.totalFeedbacks : 0,
  };
}

export async function GET(req, { params }) {
  try {
    await connectDB();

    const { doctorId } = await params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return NextResponse.json(
        { success: false, message: "Invalid doctor id" },
        { status: 400 }
      );
    }

    const doctor = await Doctor.findById(doctorId).select(
      "averageRating totalFeedbacks"
    );

    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "Doctor not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const ratingFilter = searchParams.get("rating") || "all";

    const session = await getServerSession(authOptions);
    const userId = getUserIdFromSession(session);
    const isPatient = session?.user?.role === "patient";

    let myFeedback = null;
    let canGiveFeedback = false;

    if (userId && isPatient) {
      const completedAppointment = await Appointment.findOne({
        patient: userId,
        doctor: doctorId,
        status: "completed",
      })
        .sort({ slotStart: -1 })
        .select("_id");

      myFeedback = await DoctorFeedback.findOne({
        patient: userId,
        doctor: doctorId,
      })
        .populate("patient", "name email profileUrl")
        .lean();

      canGiveFeedback = Boolean(completedAppointment && !myFeedback);
    }

    const feedbackQuery = {
      doctor: doctorId,
    };

    if (ratingFilter !== "all") {
      const ratingNumber = Number(ratingFilter);

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

    const feedbacksRaw = await DoctorFeedback.find(feedbackQuery)
      .populate("patient", "name email profileUrl")
      .sort({ rating: -1, createdAt: -1 })
      .lean();

    const feedbacks = feedbacksRaw
      .map((feedback) => ({
        ...feedback,
        isMine:
          userId &&
          feedback.patient?._id?.toString() === userId.toString(),
      }))
      .sort((a, b) => {
        if (a.isMine && !b.isMine) return -1;
        if (!a.isMine && b.isMine) return 1;

        if (b.rating !== a.rating) return b.rating - a.rating;

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    return NextResponse.json(
      {
        success: true,
        feedbacks,
        myFeedback,
        canGiveFeedback,
        stats: {
          averageRating: doctor.averageRating || 0,
          totalFeedbacks: doctor.totalFeedbacks || 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Doctor feedback fetch error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while fetching feedbacks",
      },
      { status: 500 }
    );
  }
}

export async function POST(req, { params }) {
  try {
    await connectDB();

    const { doctorId } = await params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return NextResponse.json(
        { success: false, message: "Invalid doctor id" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    const userId = getUserIdFromSession(session);

    if (!session || !userId || session.user?.role !== "patient") {
      return NextResponse.json(
        { success: false, message: "Only patients can give feedback" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const rating = Number(body.rating);
    const comment = body.comment?.toString().trim() || "";

    if (Number.isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "Doctor not found" },
        { status: 404 }
      );
    }

    const completedAppointment = await Appointment.findOne({
      patient: userId,
      doctor: doctorId,
      status: "completed",
    })
      .sort({ slotStart: -1 })
      .select("_id");

    if (!completedAppointment) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You can give feedback only after completing at least one appointment with this doctor.",
        },
        { status: 403 }
      );
    }

    const existingFeedback = await DoctorFeedback.findOne({
      patient: userId,
      doctor: doctorId,
    });

    if (existingFeedback) {
      return NextResponse.json(
        {
          success: false,
          message: "You have already given feedback to this doctor.",
        },
        { status: 409 }
      );
    }

    const feedback = await DoctorFeedback.create({
      appointment: completedAppointment._id,
      patient: userId,
      doctor: doctorId,
      rating,
      comment,
    });

    const stats = await recalculateDoctorRating(doctorId);

    const populatedFeedback = await DoctorFeedback.findById(feedback._id)
      .populate("patient", "name email profileUrl")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Feedback submitted successfully",
        feedback: {
          ...populatedFeedback,
          isMine: true,
        },
        stats,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Doctor feedback create error:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "You have already given feedback to this doctor.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while submitting feedback",
      },
      { status: 500 }
    );
  }
}
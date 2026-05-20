import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import mongoose from "mongoose";
import groq from "@/lib/groq";
import connectDB from "@/db/connect";
import Doctor from "@/models/Doctor";
import Patient from "@/models/Patient";
import Appointment from "@/models/Appointment";
import DoctorFeedback from "@/models/DoctorFeedback";

function safeJsonParse(value, fallback) {
  try {
    if (!value) return fallback;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function getPatientIdFromSession(session) {
  if (!session?.user) return null;

  if (session.user.id && mongoose.Types.ObjectId.isValid(session.user.id)) {
    return session.user.id;
  }

  if (session.user.email) {
    const patient = await Patient.findOne({
      email: session.user.email.toLowerCase(),
    })
      .select("_id")
      .lean();

    return patient?._id?.toString() || null;
  }

  return null;
}

function ruleBasedModeration(comment) {
  const text = comment.toLowerCase();

  const abusivePatterns = [
    /\bf+u+c+k+\b/i,
    /\bshit\b/i,
    /\basshole\b/i,
    /\bbastard\b/i,
    /\bchutiya\b/i,
    /\bmadarchod\b/i,
    /\bbhenchod\b/i,
    /\bkill yourself\b/i,
    /\bi will kill\b/i,
    /\bi will harm\b/i,
  ];

  const isBlocked = abusivePatterns.some(pattern => pattern.test(text));

  if (isBlocked) {
    return {
      allowed: false,
      reason: "Feedback contains abusive, threatening, or offensive words.",
    };
  }

  return {
    allowed: true,
    reason: "",
  };
}

async function moderateFeedbackWithLLM(comment) {
  const cleanComment = comment.trim();

  if (!cleanComment) {
    return {
      allowed: true,
      reason: "",
    };
  }

  const ruleResult = ruleBasedModeration(cleanComment);

  if (!ruleResult.allowed) {
    return ruleResult;
  }

  if (!groq) {
    return {
      allowed: true,
      reason: "",
    };
  }

  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
You are a strict feedback moderation system for a doctor booking platform.

Return only JSON:
{
  "allowed": true or false,
  "category": "clean" | "abusive" | "hate" | "threat" | "sexual" | "spam" | "irrelevant",
  "confidence": number between 0 and 1,
  "reason": "short reason"
}

Rules:
- Block abusive words, insults, harassment, hate speech, threats, explicit sexual content, spam, or meaningless repeated text.
- Allow honest negative feedback if it is respectful.
- Example allowed: "Doctor was late and did not explain properly."
- Example blocked: direct abuse, threats, slurs, vulgar insults.
- Do not hallucinate.
- Judge only the given feedback text.
- If unsure, set allowed true.
          `,
        },
        {
          role: "user",
          content: cleanComment,
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    const parsed = safeJsonParse(raw, {});

    const confidence =
      typeof parsed.confidence === "number" ? parsed.confidence : 0;

    if (parsed.allowed === false && confidence >= 0.7) {
      return {
        allowed: false,
        reason:
          parsed.reason ||
          "Feedback contains abusive or inappropriate content.",
      };
    }

    return {
      allowed: true,
      reason: "",
    };
  } catch (error) {
    console.error("Feedback moderation error:", error);

    return {
      allowed: true,
      reason: "",
    };
  }
}

async function updateDoctorRatingStats(doctorId) {
  const stats = await DoctorFeedback.aggregate([
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

  const averageRating = stats[0]?.averageRating
    ? Number(stats[0].averageRating.toFixed(1))
    : 0;

  const totalFeedbacks = stats[0]?.totalFeedbacks || 0;

  await Doctor.findByIdAndUpdate(doctorId, {
    averageRating,
    totalFeedbacks,
  });

  return {
    averageRating,
    totalFeedbacks,
  };
}

function formatFeedback(feedback, patientId) {
  return {
    _id: feedback._id?.toString(),
    rating: feedback.rating,
    comment: feedback.comment || "",
    createdAt: feedback.createdAt,
    isMine: feedback.patient?._id?.toString() === patientId?.toString(),
    patient: {
      _id: feedback.patient?._id?.toString(),
      name: feedback.patient?.name || "Patient",
      profileUrl: feedback.patient?.profileUrl || null,
    },
  };
}

export async function GET(req, context) {
  try {
    await connectDB();

    const { doctorId } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return NextResponse.json(
        { success: false, message: "Invalid doctor id" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const rating = searchParams.get("rating") || "all";

    const doctor = await Doctor.findById(doctorId)
      .select("_id averageRating totalFeedbacks")
      .lean();

    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "Doctor not found" },
        { status: 404 }
      );
    }

    const session = await getServerSession(authOptions);
    const patientId = await getPatientIdFromSession(session);

    const query = {
      doctor: doctorId,
    };

    if (rating !== "all") {
      const ratingNumber = Number(rating);

      if (ratingNumber >= 1 && ratingNumber <= 5) {
        query.rating = ratingNumber;
      }
    }

    const feedbackDocs = await DoctorFeedback.find(query)
      .populate("patient", "name profileUrl")
      .sort({ rating: -1, createdAt: -1 })
      .lean();

    const feedbacks = feedbackDocs
      .map(feedback => formatFeedback(feedback, patientId))
      .sort((a, b) => {
        if (a.isMine && !b.isMine) return -1;
        if (!a.isMine && b.isMine) return 1;

        if (b.rating !== a.rating) return b.rating - a.rating;

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    let myFeedback = null;
    let canGiveFeedback = false;

    if (patientId) {
      const existingFeedback = await DoctorFeedback.findOne({
        doctor: doctorId,
        patient: patientId,
      })
        .populate("patient", "name profileUrl")
        .lean();

      if (existingFeedback) {
        myFeedback = formatFeedback(existingFeedback, patientId);
      }

      const completedAppointment = await Appointment.findOne({
        doctor: doctorId,
        patient: patientId,
        status: "completed",
      })
        .select("_id")
        .lean();

      canGiveFeedback = Boolean(completedAppointment && !existingFeedback);
    }

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
    console.error("Get doctor feedbacks error:", error);

    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(req, context) {
  try {
    await connectDB();

    const { doctorId } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return NextResponse.json(
        { success: false, message: "Invalid doctor id" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please login first to submit feedback" },
        { status: 401 }
      );
    }

    if (session.user?.role && session.user.role !== "patient") {
      return NextResponse.json(
        { success: false, message: "Only patients can submit feedback" },
        { status: 403 }
      );
    }

    const patientId = await getPatientIdFromSession(session);

    if (!patientId) {
      return NextResponse.json(
        { success: false, message: "Patient account not found" },
        { status: 404 }
      );
    }

    const body = await req.json();

    const rating = Number(body.rating);
    const comment = body.comment?.toString().trim() || "";

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (comment.length > 1000) {
      return NextResponse.json(
        { success: false, message: "Feedback comment must be under 1000 characters" },
        { status: 400 }
      );
    }

    const doctor = await Doctor.findById(doctorId).select("_id").lean();

    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "Doctor not found" },
        { status: 404 }
      );
    }

    const existingFeedback = await DoctorFeedback.findOne({
      doctor: doctorId,
      patient: patientId,
    }).lean();

    if (existingFeedback) {
      return NextResponse.json(
        { success: false, message: "You have already submitted feedback for this doctor" },
        { status: 409 }
      );
    }

    const completedAppointment = await Appointment.findOne({
      doctor: doctorId,
      patient: patientId,
      status: "completed",
    })
      .sort({ slotEnd: -1 })
      .select("_id")
      .lean();

    if (!completedAppointment) {
      return NextResponse.json(
        {
          success: false,
          message: "You can submit feedback only after completing an appointment with this doctor",
        },
        { status: 403 }
      );
    }

    const moderation = await moderateFeedbackWithLLM(comment);

    if (!moderation.allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            moderation.reason ||
            "Your feedback contains inappropriate content. Please rewrite it respectfully.",
        },
        { status: 422 }
      );
    }

    const feedback = await DoctorFeedback.create({
      appointment: completedAppointment._id,
      patient: patientId,
      doctor: doctorId,
      rating,
      comment,
    });

    await Appointment.findByIdAndUpdate(completedAppointment._id, {
      feedbackGiven: true,
    });

    const stats = await updateDoctorRatingStats(doctorId);

    const populatedFeedback = await DoctorFeedback.findById(feedback._id)
      .populate("patient", "name profileUrl")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Thank you! Your feedback has been submitted.",
        feedback: formatFeedback(populatedFeedback, patientId),
        stats,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submit doctor feedback error:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "Feedback already submitted" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
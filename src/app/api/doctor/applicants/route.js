import { NextResponse } from "next/server";

import connectDB from "@/db/connect";
import Appointment from "@/models/Appointment";
import { requireDoctor } from "@/lib/apiAuth";

function getISTDateRange(dateString) {
  const start = new Date(`${dateString}T00:00:00+05:30`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

async function autoCompleteEndedAppointments(doctorId) {
    const now = new Date();
  
    await Appointment.updateMany(
      {
        doctor: doctorId,
        status: "confirmed",
        autoCompleteAfterSlot: true,
        slotEnd: { $lt: now },
      },
      {
        $set: {
          status: "completed",
        },
      }
    );
  }

function formatAppointment(app) {
  const now = new Date();

  const slotStart = new Date(app.slotStart);
  const slotEnd = new Date(app.slotEnd);

  const isSlotRunning =
    app.status === "confirmed" &&
    slotStart.getTime() <= now.getTime() &&
    slotEnd.getTime() >= now.getTime();

  return {
    _id: app._id,
    patient: app.patient,
    doctor: app.doctor,
    patientName: app.patientName,
    slotStart: app.slotStart,
    slotEnd: app.slotEnd,
    mode: app.mode,
    status: app.status,
    paymentExpiresAt: app.paymentExpiresAt,
    cancelledBy: app.cancelledBy,
    cancelledAt: app.cancelledAt,
    autoCompleteAfterSlot: Boolean(app.autoCompleteAfterSlot),
    feedbackGiven: app.feedbackGiven,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
    canMarkCompleted: isSlotRunning,
  };
}

export async function GET(req) {
  try {
    await connectDB();

    const auth = await requireDoctor();

    if (auth.error) return auth.error;

    await autoCompleteEndedAppointments(auth.user.id);

    const { searchParams } = new URL(req.url);

    const date = searchParams.get("date");
    const status = searchParams.get("status") || "confirmed";

    if (!date) {
      return NextResponse.json(
        { success: false, message: "Date is required" },
        { status: 400 }
      );
    }

    const { start, end } = getISTDateRange(date);

    const query = {
      doctor: auth.user.id,
      slotStart: {
        $gte: start,
        $lt: end,
      },
    };

    if (status === "confirmed") {
      query.status = "confirmed";
    } else if (status === "pending") {
      query.status = "pending-payment";
    } else if (status === "completed") {
      query.status = "completed";
    } else if (status === "all") {
      query.status = {
        $in: ["pending-payment", "confirmed", "completed"],
      };
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid status filter" },
        { status: 400 }
      );
    }

    const appointments = await Appointment.find(query)
      .populate({
        path: "patient",
        select: "name email profileUrl",
      })
      .sort({ slotStart: 1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        appointments: appointments.map(formatAppointment),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch doctor applicants error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while fetching appointments",
      },
      { status: 500 }
    );
  }
}
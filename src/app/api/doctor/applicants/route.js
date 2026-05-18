import { NextResponse } from "next/server";

import connectDB from "@/db/connect";
import Appointment from "@/models/Appointment";
import Payment from "@/models/Payment";
import { requireDoctor } from "@/lib/apiAuth";

function isValidDateString(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function getISTDayRange(dateString) {
  const start = new Date(`${dateString}T00:00:00+05:30`);
  const end = new Date(`${dateString}T24:00:00+05:30`);

  return { start, end };
}

function getTodayISTDateString() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const day = parts.find(p => p.type === "day")?.value;
  const month = parts.find(p => p.type === "month")?.value;
  const year = parts.find(p => p.type === "year")?.value;

  return `${year}-${month}-${day}`;
}

export async function GET(req) {
  try {
    await connectDB();

    const auth = await requireDoctor();

    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);

    const date = searchParams.get("date");
    const status = searchParams.get("status") || "confirmed";

    if (!date || !isValidDateString(date)) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid date is required in YYYY-MM-DD format",
        },
        { status: 400 }
      );
    }

    const todayIST = getTodayISTDateString();

    if (date < todayIST) {
      return NextResponse.json(
        {
          success: false,
          message: "This API is only for today or future dates. Use history for past dates.",
        },
        { status: 400 }
      );
    }

    let statusFilter = ["confirmed"];

    if (status === "pending") {
      statusFilter = ["pending-payment"];
    } else if (status === "all") {
      statusFilter = ["pending-payment", "confirmed"];
    } else if (status === "confirmed") {
      statusFilter = ["confirmed"];
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid status filter",
        },
        { status: 400 }
      );
    }

    const { start, end } = getISTDayRange(date);

    const appointments = await Appointment.find({
      doctor: auth.user.id,
      slotStart: {
        $gte: start,
        $lt: end,
      },
      status: {
        $in: statusFilter,
      },
    })
      .populate({
        path: "patient",
        select: "name email profileUrl isBlocked",
      })
      .sort({ slotStart: 1 })
      .lean();

    const appointmentIds = appointments.map(app => app._id);

    const payments = await Payment.find({
      appointment: { $in: appointmentIds },
    })
      .select("appointment amount status gateway paidAt")
      .lean();

    const paymentMap = new Map(
      payments.map(payment => [payment.appointment.toString(), payment])
    );

    const formattedAppointments = appointments.map(app => {
      const payment = paymentMap.get(app._id.toString());

      return {
        _id: app._id,
        patient: app.patient,
        patientName: app.patientName,
        slotStart: app.slotStart,
        slotEnd: app.slotEnd,
        mode: app.mode,
        status: app.status,
        paymentExpiresAt: app.paymentExpiresAt,
        payment: payment || null,
        createdAt: app.createdAt,
      };
    });

    return NextResponse.json(
      {
        success: true,
        date,
        count: formattedAppointments.length,
        appointments: formattedAppointments,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch doctor applicants error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while fetching applicants",
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";

import connectDB from "@/db/connect";
import Appointment from "@/models/Appointment";
import Payment from "@/models/Payment";
import { requireDoctor } from "@/lib/apiAuth";

function formatAppointment(app, payment, now) {
  let historyStatus = app.status;

  if (
    app.status === "no-show" ||
    (app.status === "confirmed" && new Date(app.slotEnd).getTime() < now.getTime())
  ) {
    historyStatus = "not-done";
  }

  return {
    _id: app._id,
    patient: app.patient,
    patientName: app.patientName,
    slotStart: app.slotStart,
    slotEnd: app.slotEnd,
    mode: app.mode,
    status: app.status,
    historyStatus,
    feedbackGiven: app.feedbackGiven,
    createdAt: app.createdAt,
    payment: payment || null,
  };
}

export async function GET(req) {
  try {
    await connectDB();

    const auth = await requireDoctor();

    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status") || "all";

    const requestedPage = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(
      30,
      Math.max(1, Number(searchParams.get("limit") || 6))
    );

    const now = new Date();

    const baseQuery = {
      doctor: auth.user.id,
      status: { $ne: "cancelled" },
    };

    const completedQuery = {
      ...baseQuery,
      status: "completed",
    };

    const notDoneQuery = {
      doctor: auth.user.id,
      status: { $ne: "cancelled" },
      $or: [
        { status: "no-show" },
        {
          status: "confirmed",
          slotEnd: { $lt: now },
        },
      ],
    };

    let query = {};

    if (status === "completed") {
      query = completedQuery;
    } else if (status === "not-done") {
      query = notDoneQuery;
    } else if (status === "all") {
      query = {
        doctor: auth.user.id,
        status: { $ne: "cancelled" },
        $or: [
          { status: "completed" },
          { status: "no-show" },
          {
            status: "confirmed",
            slotEnd: { $lt: now },
          },
        ],
      };
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid history status filter" },
        { status: 400 }
      );
    }

    const [completedCount, notDoneCount, totalAppointments] = await Promise.all([
      Appointment.countDocuments(completedQuery),
      Appointment.countDocuments(notDoneQuery),
      Appointment.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalAppointments / limit);
    const page = totalPages > 0 ? Math.min(requestedPage, totalPages) : 1;
    const skip = (page - 1) * limit;

    const appointments = await Appointment.find(query)
      .populate({
        path: "patient",
        select: "name email profileUrl",
      })
      .sort({ slotStart: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const appointmentIds = appointments.map(app => app._id);

    const payments = await Payment.find({
      appointment: { $in: appointmentIds },
    })
      .select(
        "appointment amount gateway gatewayOrderId gatewayPaymentId status refundAmount paidAt createdAt"
      )
      .lean();

    const paymentMap = new Map(
      payments.map(payment => [payment.appointment.toString(), payment])
    );

    const formattedAppointments = appointments.map(app =>
      formatAppointment(app, paymentMap.get(app._id.toString()), now)
    );

    return NextResponse.json(
      {
        success: true,
        appointments: formattedAppointments,
        stats: {
          all: completedCount + notDoneCount,
          completed: completedCount,
          notDone: notDoneCount,
        },
        pagination: {
          page,
          limit,
          totalAppointments,
          totalPages,
          hasPrevPage: page > 1,
          hasNextPage: page < totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch doctor history error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while fetching history",
      },
      { status: 500 }
    );
  }
}
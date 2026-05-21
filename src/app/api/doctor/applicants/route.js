import { NextResponse } from "next/server";

import connectDB from "@/db/connect";
import Appointment from "@/models/Appointment";
import Payment from "@/models/Payment";
import { requireDoctor } from "@/lib/apiAuth";

function getStartAndEndOfDate(date) {
  const start = new Date(`${date}T00:00:00+05:30`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

function formatAppointment(app, payment) {
  return {
    _id: app._id,
    patient: app.patient,
    patientName: app.patientName,
    slotStart: app.slotStart,
    slotEnd: app.slotEnd,
    mode: app.mode,
    status: app.status,
    cancelledBy: app.cancelledBy,
    cancelledAt: app.cancelledAt,
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

    const date = searchParams.get("date");
    const status = searchParams.get("status") || "confirmed";

    if (!date) {
      return NextResponse.json(
        { success: false, message: "Date is required" },
        { status: 400 }
      );
    }

    const hasPagination =
      searchParams.has("page") || searchParams.has("limit");

    const requestedPage = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(
      30,
      Math.max(1, Number(searchParams.get("limit") || 6))
    );

    const { start, end } = getStartAndEndOfDate(date);

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
    } else if (status === "all") {
      query.status = { $in: ["confirmed", "pending-payment"] };
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid status filter" },
        { status: 400 }
      );
    }

    const totalAppointments = await Appointment.countDocuments(query);

    const totalPages = Math.ceil(totalAppointments / limit);
    const page =
      totalPages > 0 ? Math.min(requestedPage, totalPages) : 1;

    const skip = (page - 1) * limit;

    let appointmentQuery = Appointment.find(query)
      .populate({
        path: "patient",
        select: "name email profileUrl isBlocked",
      })
      .sort({ slotStart: 1 });

    if (hasPagination) {
      appointmentQuery = appointmentQuery.skip(skip).limit(limit);
    }

    const appointments = await appointmentQuery.lean();

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
      formatAppointment(app, paymentMap.get(app._id.toString()))
    );

    return NextResponse.json(
      {
        success: true,
        date,
        status,
        appointments: formattedAppointments,
        pagination: {
          page,
          limit: hasPagination ? limit : totalAppointments,
          totalAppointments,
          totalPages: hasPagination ? totalPages : totalAppointments > 0 ? 1 : 0,
          hasPrevPage: hasPagination ? page > 1 : false,
          hasNextPage: hasPagination ? page < totalPages : false,
        },
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
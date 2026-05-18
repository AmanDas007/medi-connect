import { NextResponse } from "next/server";

import connectDB from "@/db/connect";
import Appointment from "@/models/Appointment";
import Payment from "@/models/Payment";
import { requirePatient } from "@/lib/apiAuth";

function getRefundPreview(appointment, payment) {
  if (!appointment || !payment || payment.status !== "paid") {
    return {
      cancellationFee: 0,
      refundAmount: 0,
      isWithinLastTwoHours: false,
    };
  }

  const now = new Date();
  const slotStart = new Date(appointment.slotStart);
  const diffMs = slotStart.getTime() - now.getTime();

  const isWithinLastTwoHours = diffMs > 0 && diffMs <= 2 * 60 * 60 * 1000;
  const cancellationFee = isWithinLastTwoHours ? Math.min(50, payment.amount) : 0;
  const refundAmount = Math.max(0, payment.amount - cancellationFee);

  return {
    cancellationFee,
    refundAmount,
    isWithinLastTwoHours,
  };
}

function formatAppointment(app, payment) {
  const canCancel =
    app.status === "confirmed" && new Date(app.slotStart).getTime() > Date.now();

  const isMissed =
    app.status === "no-show" ||
    (app.status === "confirmed" && new Date(app.slotEnd).getTime() < Date.now());

  return {
    _id: app._id,
    doctor: app.doctor,
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
    canCancel,
    isMissed,
    refundPreview: canCancel ? getRefundPreview(app, payment) : null,
  };
}

export async function GET(req) {
  try {
    await connectDB();

    const auth = await requirePatient();

    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);

    const type = searchParams.get("type") || "upcoming";
    const status = searchParams.get("status") || "all";

    const now = new Date();

    let query = {
      patient: auth.user.id,
    };

    let sort = { slotStart: 1 };

    if (type === "upcoming") {
      query.slotStart = { $gte: now };

      if (status === "confirmed") {
        query.status = "confirmed";
      } else if (status === "pending") {
        query.status = "pending-payment";
      } else if (status === "all") {
        query.status = { $in: ["confirmed", "pending-payment"] };
      } else {
        return NextResponse.json(
          { success: false, message: "Invalid upcoming status filter" },
          { status: 400 }
        );
      }

      sort = { slotStart: 1 };
    } else if (type === "past") {
      if (status === "completed") {
        query.status = "completed";
      } else if (status === "cancelled") {
        query.status = "cancelled";
      } else if (status === "expired") {
        query.status = "expired";
      } else if (status === "missed") {
        query.$or = [
          { status: "no-show" },
          {
            status: "confirmed",
            slotEnd: { $lt: now },
          },
        ];
      } else if (status === "all") {
        query.$or = [
          { slotEnd: { $lt: now } },
          {
            status: {
              $in: ["completed", "cancelled", "expired", "no-show"],
            },
          },
        ];
      } else {
        return NextResponse.json(
          { success: false, message: "Invalid past status filter" },
          { status: 400 }
        );
      }

      sort = { slotStart: -1 };
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid appointment type" },
        { status: 400 }
      );
    }

    const appointments = await Appointment.find(query)
      .populate({
        path: "doctor",
        select:
          "name email profileUrl specialization experienceYears clinic consultationFee averageRating totalFeedbacks",
      })
      .sort(sort)
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
      formatAppointment(app, paymentMap.get(app._id.toString()))
    );

    return NextResponse.json(
      {
        success: true,
        type,
        status,
        appointments: formattedAppointments,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch patient appointments error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while fetching appointments",
      },
      { status: 500 }
    );
  }
}
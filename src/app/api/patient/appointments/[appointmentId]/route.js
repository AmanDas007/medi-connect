import { NextResponse } from "next/server";
import mongoose from "mongoose";

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

function formatAppointment(appointment, payment) {
  const canCancel =
    appointment.status === "confirmed" &&
    new Date(appointment.slotStart).getTime() > Date.now();

  return {
    _id: appointment._id,
    doctor: appointment.doctor,
    patientName: appointment.patientName,
    slotStart: appointment.slotStart,
    slotEnd: appointment.slotEnd,
    mode: appointment.mode,
    status: appointment.status,
    cancelledBy: appointment.cancelledBy,
    cancelledAt: appointment.cancelledAt,
    feedbackGiven: appointment.feedbackGiven,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
    payment: payment || null,
    canCancel,
    refundPreview: canCancel ? getRefundPreview(appointment, payment) : null,
  };
}

export async function GET(req, { params }) {
  try {
    await connectDB();

    const auth = await requirePatient();

    if (auth.error) return auth.error;

    const { appointmentId } = await params;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return NextResponse.json(
        { success: false, message: "Invalid appointment id" },
        { status: 400 }
      );
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patient: auth.user.id,
    })
      .populate({
        path: "doctor",
        select:
          "name email profileUrl specialization experienceYears clinic consultationFee averageRating totalFeedbacks",
      })
      .lean();

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: "Appointment not found" },
        { status: 404 }
      );
    }

    const payment = await Payment.findOne({
      appointment: appointment._id,
      patient: auth.user.id,
    })
      .select(
        "appointment amount gateway gatewayOrderId gatewayPaymentId status refundAmount paidAt createdAt updatedAt"
      )
      .lean();

    return NextResponse.json(
      {
        success: true,
        appointment: formatAppointment(appointment, payment),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch patient appointment details error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while fetching appointment details",
      },
      { status: 500 }
    );
  }
}
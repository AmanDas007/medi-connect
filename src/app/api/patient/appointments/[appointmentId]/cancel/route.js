import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/db/connect";
import Appointment from "@/models/Appointment";
import Payment from "@/models/Payment";
import { razorpay } from "@/lib/razorpay";
import { requirePatient } from "@/lib/apiAuth";

function getRefundCalculation(appointment, payment) {
  const now = new Date();
  const slotStart = new Date(appointment.slotStart);
  const diffMs = slotStart.getTime() - now.getTime();

  const isWithinLastTwoHours = diffMs > 0 && diffMs <= 2 * 60 * 60 * 1000;
  const cancellationFee = isWithinLastTwoHours ? Math.min(50, payment.amount) : 0;
  const refundAmount = Math.max(0, payment.amount - cancellationFee);

  return {
    isWithinLastTwoHours,
    cancellationFee,
    refundAmount,
  };
}

export async function POST(req, { params }) {
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
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: "Appointment not found" },
        { status: 404 }
      );
    }

    if (appointment.status === "cancelled") {
      const payment = await Payment.findOne({
        appointment: appointment._id,
        patient: auth.user.id,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Appointment already cancelled",
          appointment,
          payment,
        },
        { status: 200 }
      );
    }

    if (appointment.status !== "confirmed") {
      return NextResponse.json(
        {
          success: false,
          message: `Only confirmed appointments can be cancelled. Current status: ${appointment.status}`,
        },
        { status: 400 }
      );
    }

    if (new Date(appointment.slotStart).getTime() <= Date.now()) {
      return NextResponse.json(
        {
          success: false,
          message: "Past or started appointments cannot be cancelled",
        },
        { status: 400 }
      );
    }

    const payment = await Payment.findOne({
      appointment: appointment._id,
      patient: auth.user.id,
    });

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment record not found for this appointment",
        },
        { status: 404 }
      );
    }

    if (payment.status === "refunded") {
      appointment.status = "cancelled";
      appointment.cancelledBy = "patient";
      appointment.cancelledAt = appointment.cancelledAt || new Date();
      appointment.activeSlotKey = undefined;

      await appointment.save();

      return NextResponse.json(
        {
          success: true,
          message: "Appointment cancelled. Payment was already refunded.",
          appointment,
          payment,
        },
        { status: 200 }
      );
    }

    if (payment.status !== "paid") {
      return NextResponse.json(
        {
          success: false,
          message: `Refund cannot be processed because payment status is ${payment.status}`,
        },
        { status: 400 }
      );
    }

    if (!payment.gatewayPaymentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Razorpay payment id not found. Refund cannot be processed.",
        },
        { status: 400 }
      );
    }

    const { cancellationFee, refundAmount, isWithinLastTwoHours } =
      getRefundCalculation(appointment, payment);

    let razorpayRefund = null;

    if (refundAmount > 0) {
      razorpayRefund = await razorpay.payments.refund(payment.gatewayPaymentId, {
        amount: Math.round(refundAmount * 100),
        speed: "normal",
        notes: {
          appointmentId: appointment._id.toString(),
          cancelledBy: "patient",
          cancellationFee: String(cancellationFee),
        },
        receipt: `refund_${appointment._id}`,
      });
    }

    payment.status = "refunded";
    payment.refundAmount = refundAmount;
    await payment.save();

    appointment.status = "cancelled";
    appointment.cancelledBy = "patient";
    appointment.cancelledAt = new Date();
    appointment.activeSlotKey = undefined;
    await appointment.save();

    return NextResponse.json(
      {
        success: true,
        message: isWithinLastTwoHours
          ? `Appointment cancelled. ₹${refundAmount} refunded after ₹${cancellationFee} cancellation fee.`
          : `Appointment cancelled. Full refund of ₹${refundAmount} initiated.`,
        appointment,
        payment,
        refund: razorpayRefund,
        refundDetails: {
          cancellationFee,
          refundAmount,
          isWithinLastTwoHours,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Cancel appointment error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.description || "Something went wrong while cancelling appointment",
      },
      { status: 500 }
    );
  }
}
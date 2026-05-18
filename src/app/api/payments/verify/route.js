import { NextResponse } from "next/server";
import crypto from "crypto";

import connectDB from "@/db/connect";
import Appointment from "@/models/Appointment";
import Payment from "@/models/Payment";
import { requirePatient } from "@/lib/apiAuth";

function safeCompare(a, b) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) return false;

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export async function POST(req) {
  try {
    await connectDB();

    const auth = await requirePatient();

    if (auth.error) return auth.error;

    const {
      appointmentId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    if (
      !appointmentId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment verification data is missing",
        },
        { status: 400 }
      );
    }

    const payment = await Payment.findOne({
      appointment: appointmentId,
      patient: auth.user.id,
      gatewayOrderId: razorpay_order_id,
    });

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment record not found",
        },
        { status: 404 }
      );
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patient: auth.user.id,
    });

    if (!appointment) {
      return NextResponse.json(
        {
          success: false,
          message: "Appointment not found",
        },
        { status: 404 }
      );
    }

    /*
      Important:
      This does NOT create another appointment.
      It only returns success if the same appointment was already confirmed.
    */
    if (payment.status === "paid" && appointment.status === "confirmed") {
      if (
        payment.gatewayPaymentId &&
        payment.gatewayPaymentId !== razorpay_payment_id
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "This appointment is already paid with another payment id",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Payment already verified and appointment already confirmed",
          appointment,
        },
        { status: 200 }
      );
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValidSignature = safeCompare(
      generatedSignature,
      razorpay_signature
    );

    if (!isValidSignature) {
      if (payment.status !== "paid") {
        payment.status = "failed";
        payment.gatewayPaymentId = razorpay_payment_id;
        payment.gatewaySignature = razorpay_signature;
        await payment.save();
      }

      if (appointment.status === "pending-payment") {
        appointment.status = "expired";
        appointment.activeSlotKey = undefined;
        await appointment.save();
      }

      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment signature",
        },
        { status: 400 }
      );
    }

    /*
      If appointment already confirmed but payment record was not updated
      properly, fix payment and return success.
    */
    if (appointment.status === "confirmed") {
      if (
        payment.gatewayPaymentId &&
        payment.gatewayPaymentId !== razorpay_payment_id
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "This appointment is already paid with another payment id",
          },
          { status: 409 }
        );
      }

      payment.status = "paid";
      payment.gatewayPaymentId = razorpay_payment_id;
      payment.gatewaySignature = razorpay_signature;
      payment.paidAt = payment.paidAt || new Date();
      await payment.save();

      return NextResponse.json(
        {
          success: true,
          message: "Appointment already confirmed",
          appointment,
        },
        { status: 200 }
      );
    }

    if (appointment.status !== "pending-payment") {
      return NextResponse.json(
        {
          success: false,
          message: `Appointment cannot be confirmed because it is already ${appointment.status}`,
        },
        { status: 400 }
      );
    }

    if (
      appointment.paymentExpiresAt &&
      appointment.paymentExpiresAt < new Date()
    ) {
      appointment.status = "expired";
      appointment.activeSlotKey = undefined;
      await appointment.save();

      payment.status = "failed";
      payment.gatewayPaymentId = razorpay_payment_id;
      payment.gatewaySignature = razorpay_signature;
      await payment.save();

      return NextResponse.json(
        {
          success: false,
          message: "Payment time expired. Please book again.",
        },
        { status: 400 }
      );
    }

    payment.status = "paid";
    payment.gatewayPaymentId = razorpay_payment_id;
    payment.gatewaySignature = razorpay_signature;
    payment.paidAt = new Date();
    await payment.save();

    appointment.status = "confirmed";
    await appointment.save();

    return NextResponse.json(
      {
        success: true,
        message: "Payment verified and appointment confirmed",
        appointment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Payment verify error:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "This Razorpay payment id is already used",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while verifying payment",
      },
      { status: 500 }
    );
  }
}
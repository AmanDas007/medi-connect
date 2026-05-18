import { NextResponse } from "next/server";

import connectDB from "@/db/connect";
import Appointment from "@/models/Appointment";
import Payment from "@/models/Payment";
import { requirePatient } from "@/lib/apiAuth";

export async function POST(req) {
  try {
    await connectDB();

    const auth = await requirePatient();

    if (auth.error) return auth.error;

    const { appointmentId } = await req.json();

    if (!appointmentId) {
      return NextResponse.json(
        { success: false, message: "Appointment id is required" },
        { status: 400 }
      );
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patient: auth.user.id,
      status: "pending-payment",
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: "Pending appointment not found" },
        { status: 404 }
      );
    }

    appointment.status = "expired";
    appointment.activeSlotKey = undefined;
    await appointment.save();

    await Payment.findOneAndUpdate(
      {
        appointment: appointment._id,
        patient: auth.user.id,
        status: "created",
      },
      {
        $set: { status: "failed" },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Pending appointment released",
    });
  } catch (error) {
    console.error("Release pending appointment error:", error);

    return NextResponse.json(
      { success: false, message: "Something went wrong while releasing appointment" },
      { status: 500 }
    );
  }
}
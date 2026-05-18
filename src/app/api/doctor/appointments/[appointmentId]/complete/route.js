import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/db/connect";
import Appointment from "@/models/Appointment";
import { requireDoctor } from "@/lib/apiAuth";

export async function POST(req, { params }) {
  try {
    await connectDB();

    const auth = await requireDoctor();

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
      doctor: auth.user.id,
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: "Appointment not found" },
        { status: 404 }
      );
    }

    if (appointment.status === "completed") {
      return NextResponse.json(
        {
          success: true,
          message: "Appointment already completed",
          appointment,
        },
        { status: 200 }
      );
    }

    if (appointment.status !== "confirmed") {
      return NextResponse.json(
        {
          success: false,
          message: `Only confirmed appointments can be completed. Current status: ${appointment.status}`,
        },
        { status: 400 }
      );
    }

    const now = new Date();

    if (new Date(appointment.slotStart).getTime() > now.getTime()) {
      return NextResponse.json(
        {
          success: false,
          message: "Appointment can be completed only after the slot starts",
        },
        { status: 400 }
      );
    }

    appointment.status = "completed";
    await appointment.save();

    return NextResponse.json(
      {
        success: true,
        message: "Appointment marked as completed",
        appointment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Complete appointment error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while completing appointment",
      },
      { status: 500 }
    );
  }
}
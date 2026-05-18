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

    if (appointment.status !== "confirmed") {
      return NextResponse.json(
        {
          success: false,
          message: `Only confirmed appointments can be auto-completed. Current status: ${appointment.status}`,
        },
        { status: 400 }
      );
    }

    const now = new Date();

    if (new Date(appointment.slotStart).getTime() > now.getTime()) {
      return NextResponse.json(
        {
          success: false,
          message: "Auto mark done can be enabled only after the slot starts",
        },
        { status: 400 }
      );
    }

    if (new Date(appointment.slotEnd).getTime() < now.getTime()) {
      appointment.status = "completed";
      appointment.autoCompleteAfterSlot = true;
      await appointment.save();

      return NextResponse.json(
        {
          success: true,
          message: "Slot already ended, appointment marked as completed",
          appointment,
        },
        { status: 200 }
      );
    }

    appointment.autoCompleteAfterSlot = true;
    await appointment.save();

    return NextResponse.json(
      {
        success: true,
        message: "Auto mark done enabled. Appointment will be completed after slot ends.",
        appointment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Enable auto complete appointment error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while enabling auto mark done",
      },
      { status: 500 }
    );
  }
}
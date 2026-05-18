import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/db/connect";
import Appointment from "@/models/Appointment";

function isValidDateString(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function getISTDayRange(dateString) {
  const start = new Date(`${dateString}T00:00:00+05:30`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
}

function formatISTTime(date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));
}

export async function GET(req, { params }) {
  try {
    await connectDB();

    const { doctorId } = await params;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return NextResponse.json(
        { success: false, message: "Invalid doctor id" },
        { status: 400 }
      );
    }

    if (!date || !isValidDateString(date)) {
      return NextResponse.json(
        { success: false, message: "Valid date is required" },
        { status: 400 }
      );
    }

    const { start, end } = getISTDayRange(date);

    await Appointment.updateMany(
      {
        doctor: doctorId,
        status: "pending-payment",
        paymentExpiresAt: { $lt: new Date() },
      },
      {
        $set: { status: "expired" },
        $unset: { activeSlotKey: "" },
      }
    );

    const appointments = await Appointment.find({
      doctor: doctorId,
      slotStart: {
        $gte: start,
        $lt: end,
      },
      $or: [
        {
          status: {
            $in: ["confirmed", "completed", "no-show"],
          },
        },
        {
          status: "pending-payment",
          paymentExpiresAt: { $gt: new Date() },
        },
      ],
    })
      .select("slotStart slotEnd status")
      .lean();

    const bookedSlots = appointments.map(app => ({
      startTime: formatISTTime(app.slotStart),
      endTime: formatISTTime(app.slotEnd),
      status: app.status,
      label: `${formatISTTime(app.slotStart)} - ${formatISTTime(app.slotEnd)}`,
    }));

    return NextResponse.json(
      {
        success: true,
        date,
        bookedSlots,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch booked slots error:", error);

    return NextResponse.json(
      { success: false, message: "Something went wrong while fetching booked slots" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";

import connectDB from "@/db/connect";
import Appointment from "@/models/Appointment";
import Payment from "@/models/Payment";
import { requirePatient } from "@/lib/apiAuth";

function getTodayISTRange() {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = parts.find(p => p.type === "year")?.value;
  const month = parts.find(p => p.type === "month")?.value;
  const day = parts.find(p => p.type === "day")?.value;

  const dateString = `${year}-${month}-${day}`;

  const start = new Date(`${dateString}T00:00:00+05:30`);
  const end = new Date(`${dateString}T24:00:00+05:30`);

  return { start, end };
}

export async function GET() {
  try {
    await connectDB();

    const auth = await requirePatient();

    if (auth.error) return auth.error;

    const { start, end } = getTodayISTRange();

    const appointments = await Appointment.find({
      patient: auth.user.id,
      slotStart: {
        $gte: start,
        $lt: end,
      },
      status: "confirmed",
    })
      .populate({
        path: "doctor",
        select: "name specialization profileUrl clinic consultationFee",
      })
      .sort({ slotStart: 1 })
      .lean();

    const appointmentIds = appointments.map(app => app._id);

    const payments = await Payment.find({
      appointment: { $in: appointmentIds },
    })
      .select("appointment amount status")
      .lean();

    const paymentMap = new Map(
      payments.map(payment => [payment.appointment.toString(), payment])
    );

    const formattedAppointments = appointments.map(app => ({
      _id: app._id,
      doctor: app.doctor,
      patientName: app.patientName,
      slotStart: app.slotStart,
      slotEnd: app.slotEnd,
      mode: app.mode,
      status: app.status,
      payment: paymentMap.get(app._id.toString()) || null,
    }));

    return NextResponse.json(
      {
        success: true,
        appointments: formattedAppointments,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch today patient appointments error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while fetching today's appointments",
      },
      { status: 500 }
    );
  }
}
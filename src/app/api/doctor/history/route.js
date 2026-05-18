import { NextResponse } from "next/server";

import connectDB from "@/db/connect";
import Appointment from "@/models/Appointment";
import Payment from "@/models/Payment";
import Patient from "@/models/Patient";
import { requireDoctor } from "@/lib/apiAuth";

function isNotDoneAppointment(appointment) {
  return ["confirmed", "no-show"].includes(appointment.status);
}

function getHistoryStatus(appointment) {
  if (appointment.status === "completed") return "completed";
  if (appointment.status === "cancelled") return "cancelled";
  if (isNotDoneAppointment(appointment)) return "not-done";
  return appointment.status;
}

export async function GET(req) {
  try {
    await connectDB();

    const auth = await requireDoctor();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";

    const now = new Date();

    await Appointment.updateMany(
      {
        doctor: auth.user.id,
        status: "confirmed",
        autoCompleteAfterSlot: true,
        slotEnd: { $lt: now },
      },
      {
        $set: {
          status: "completed",
        },
      }
    );

    const baseQuery = {
      doctor: auth.user.id,
      slotEnd: { $lt: now },
      status: {
        $nin: ["pending-payment", "expired"],
      },
    };

    const allPastAppointments = await Appointment.find(baseQuery)
      .populate("patient", "name email profileUrl")
      .sort({ slotStart: -1 })
      .lean();

    let filteredAppointments = allPastAppointments;

    if (status === "completed") {
      filteredAppointments = allPastAppointments.filter(
        appointment => appointment.status === "completed"
      );
    }

    if (status === "not-done") {
      filteredAppointments = allPastAppointments.filter(isNotDoneAppointment);
    }

    const appointmentIds = filteredAppointments.map(item => item._id);

    const payments = await Payment.find({
      appointment: { $in: appointmentIds },
    }).lean();

    const paymentMap = new Map(
      payments.map(payment => [payment.appointment.toString(), payment])
    );

    const appointments = filteredAppointments.map(appointment => ({
      ...appointment,
      historyStatus: getHistoryStatus(appointment),
      payment: paymentMap.get(appointment._id.toString()) || null,
    }));

    const completedCount = allPastAppointments.filter(
      appointment => appointment.status === "completed"
    ).length;

    const notDoneCount = allPastAppointments.filter(isNotDoneAppointment).length;

    return NextResponse.json(
      {
        success: true,
        appointments,
        stats: {
          all: allPastAppointments.length,
          completed: completedCount,
          notDone: notDoneCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Doctor history fetch error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while fetching history",
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/db/connect";
import Doctor from "@/models/Doctor";
import Appointment from "@/models/Appointment";
import Payment from "@/models/Payment";
import { razorpay } from "@/lib/razorpay";
import { requirePatient } from "@/lib/apiAuth";

function buildIndiaDate(dateString, timeString) {
  return new Date(`${dateString}T${timeString}:00+05:30`);
}

function isValidSlot(doctor, dayOfWeek, startTime, endTime) {
  const dayAvailability = doctor.availability?.find(
    day => day.dayOfWeek === dayOfWeek && day.isAvailable
  );

  if (!dayAvailability) return false;

  return dayAvailability.slots?.some(
    slot => slot.startTime === startTime && slot.endTime === endTime
  );
}

export async function POST(req) {
  let appointment = null;

  try {
    await connectDB();

    const auth = await requirePatient();

    if (auth.error) return auth.error;

    const { doctorId, appointmentDate, startTime, endTime } = await req.json();

    const mode = "offline";

    if (!doctorId || !appointmentDate || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, message: "Doctor, date and slot are required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return NextResponse.json(
        { success: false, message: "Invalid doctor id" },
        { status: 400 }
      );
    }

    const doctor = await Doctor.findOne({
      _id: doctorId,
      isBlocked: false,
    });

    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "Doctor not found" },
        { status: 404 }
      );
    }

    if (!doctor.consultationFee || doctor.consultationFee <= 0) {
      return NextResponse.json(
        { success: false, message: "Doctor consultation fee is invalid" },
        { status: 400 }
      );
    }

    const slotStart = buildIndiaDate(appointmentDate, startTime);
    const slotEnd = buildIndiaDate(appointmentDate, endTime);

    if (Number.isNaN(slotStart.getTime()) || Number.isNaN(slotEnd.getTime())) {
      return NextResponse.json(
        { success: false, message: "Invalid slot date or time" },
        { status: 400 }
      );
    }

    if (slotStart < new Date()) {
      return NextResponse.json(
        { success: false, message: "You cannot book a past slot" },
        { status: 400 }
      );
    }

    if (slotEnd <= slotStart) {
      return NextResponse.json(
        { success: false, message: "Slot end time must be after start time" },
        { status: 400 }
      );
    }

    const selectedDate = new Date(`${appointmentDate}T00:00:00+05:30`);
    const dayOfWeek = selectedDate.getDay();

    const validSlot = isValidSlot(doctor, dayOfWeek, startTime, endTime);

    if (!validSlot) {
      return NextResponse.json(
        { success: false, message: "This slot is not available for this doctor" },
        { status: 400 }
      );
    }

    const activeSlotKey = `${doctor._id}_${slotStart.toISOString()}`;

    await Appointment.updateMany(
      {
        doctor: doctor._id,
        status: "pending-payment",
        paymentExpiresAt: { $lt: new Date() },
      },
      {
        $set: { status: "expired" },
        $unset: { activeSlotKey: "" },
      }
    );

    appointment = await Appointment.create({
      patient: auth.user.id,
      doctor: doctor._id,
      patientName: auth.user.name || "Patient",
      slotStart,
      slotEnd,
      mode: "offline",
      status: "pending-payment",
      paymentExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      activeSlotKey,
      feedbackGiven: false,
    });

    const amount = doctor.consultationFee;
    const amountInPaise = Math.round(amount * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `apt_${appointment._id}`,
      notes: {
        appointmentId: appointment._id.toString(),
        doctorId: doctor._id.toString(),
        patientId: auth.user.id.toString(),
        mode: "offline",
      },
    });

    const payment = await Payment.create({
      appointment: appointment._id,
      patient: auth.user.id,
      doctor: doctor._id,
      amount,
      gateway: "razorpay",
      gatewayOrderId: order.id,
      status: "created",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Order created successfully",
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        orderId: order.id,
        amount: amountInPaise,
        currency: "INR",
        appointmentId: appointment._id,
        paymentId: payment._id,
        mode: "offline",
        doctor: {
          id: doctor._id,
          name: doctor.name,
          email: doctor.email,
          consultationFee: doctor.consultationFee,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create appointment order error:", error);

    if (appointment?._id) {
      await Appointment.findByIdAndUpdate(appointment._id, {
        $set: { status: "expired" },
        $unset: { activeSlotKey: "" },
      });
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "This slot was just booked by someone else" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Something went wrong while creating payment order" },
      { status: 500 }
    );
  }
}
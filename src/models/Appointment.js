import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },

    patientName: {
        type: String,
        required: true,
        trim: true,
    },

    slotStart: {
      type: Date,
      required: true,
      index: true,
    }, // full date + time, example: 2026-05-05T10:00:00

    slotEnd: {
      type: Date,
      required: true,
    },

    mode: {
      type: String,
      enum: ["offline", "online"],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending-payment",
        "confirmed",
        "completed",
        "cancelled",
        "expired",
        "no-show",
      ],
      default: "pending-payment",
      index: true,
    },

    paymentExpiresAt: {
      type: Date,
    }, // needed for slot locking, if payment not done -> slot released

    activeSlotKey: {
      type: String,
      unique: true,
      sparse: true,
      // doctorId_slotStart
      // example: 663abc_2026-05-05T10:00:00.000Z
    },

    cancelledBy: {
      type: String,
      enum: ["patient", "doctor", "admin", null],
      default: null,
    },

    cancelledAt: {
        type: Date,
        default: null,
    },

    feedbackGiven: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctor: 1, slotStart: 1 });
appointmentSchema.index({ patient: 1, slotStart: -1 });

export default mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);
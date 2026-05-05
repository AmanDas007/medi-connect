import mongoose from "mongoose";

const vcSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true,
    },

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

    provider: {
      type: String,
      enum: ["zego", "agora", "jitsi", "daily", "other"],
      default: "jitsi",
    },

    roomId: {
      type: String,
      required: true,
      unique: true,
    },

    meetingUrl: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["scheduled", "started", "ended", "cancelled"],
      default: "scheduled",
      index: true,
    },

    startedAt: {
      type: Date,
    },

    endedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.models.VC || mongoose.model("VC", vcSchema);
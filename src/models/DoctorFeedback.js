import mongoose from "mongoose";

const doctorFeedbackSchema = new mongoose.Schema(
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

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

doctorFeedbackSchema.index({ doctor: 1, createdAt: -1 });
doctorFeedbackSchema.index({ patient: 1, doctor: 1 }, { unique: true });

export default mongoose.models.DoctorFeedback || mongoose.model("DoctorFeedback", doctorFeedbackSchema);
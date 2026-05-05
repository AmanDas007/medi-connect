import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      default: "patient",
      enum: ["patient"],
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      select: false,
      // required only for credentials login
    },

    authProvider: {
      type: String,
      enum: ["credentials", "google", "github"],
      default: "credentials",
    },

    profileUrl: {
      type: String,
      default: null,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Patient || mongoose.model("Patient", patientSchema);
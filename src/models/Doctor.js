import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: true,
      // "09:00"
    },

    endTime: {
      type: String,
      required: true,
      // "13:00"
    },
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
      // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    slots: [slotSchema],
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      default: "doctor",
      enum: ["doctor"],
    },

    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
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

    licenceUrl: {
      type: String,
      required: true,
    },

    specialization: {
      type: String,
      required: true,
      trim: true,
      index: true,
      // Cardiologist, Dentist, Dermatologist, etc.
    },

    experienceYears: {
      type: Number,
      default: 0,
    },

    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    clinic: {
        name: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
            index: true,
        },
        state: {
            type: String,
            required: true,
        },
        pincode: {
            type: String,
            required: true,
        },

        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number],
                // [longitude, latitude]
            },
        },
    },

    consultationFee: {
      type: Number,
      required: true,
    },

    availability: [availabilitySchema],

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalFeedbacks: {
      type: Number,
      default: 0,
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

doctorSchema.index({ "clinic.location": "2dsphere" });

export default mongoose.models.Doctor || mongoose.model("Doctor", doctorSchema);
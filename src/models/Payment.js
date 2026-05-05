import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true, // this avoids multiple payment by creating 1:1 relationship b/w appointment and payment
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

    amount: {
      type: Number,
      required: true,
    },

    gateway: {
      type: String,
      enum: ["razorpay", "stripe"],
      default: "razorpay",
    },

    gatewayOrderId: {
      type: String,
      unique: true,
      sparse: true,
    },

    gatewayPaymentId: {
      type: String,
      unique: true,
      sparse: true,
    },

    gatewaySignature: {
        type: String,
        default: null,
    },

    status: {
      type: String,
      enum: ["created", "paid", "failed", "refunded"],
      default: "created",
      index: true,
    },

    refundAmount: {
        type: Number,
        default: 0,
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
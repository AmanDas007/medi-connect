import { NextResponse } from "next/server";

import connectDB from "@/db/connect";
import { findAccountByEmail } from "@/components/userLookup";
import { verifyOtp, deleteOtp, createResetToken } from "@/lib/otp";

export async function POST(req) {
  try {
    await connectDB();

    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    const lookup = await findAccountByEmail(normalizedEmail);

    if (!lookup.user) {
      return NextResponse.json(
        { success: false, message: "Account not found" },
        { status: 404 }
      );
    }

    const isOtpCorrect = await verifyOtp({
      email: normalizedEmail,
      otp,
    });

    if (!isOtpCorrect) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    await deleteOtp({
      email: normalizedEmail,
    });

    const resetToken = await createResetToken({
      email: normalizedEmail,
    });

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      resetToken,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);

    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
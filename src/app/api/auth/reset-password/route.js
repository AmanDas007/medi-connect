import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import connectDB from "@/db/connect";
import { findAccountByEmail } from "@/components/userLookup";
import { verifyResetToken, deleteResetToken } from "@/lib/otp";

export async function POST(req) {
  try {
    await connectDB();

    const { email, resetToken, newPassword } = await req.json();

    if (!email || !resetToken || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Email, resetToken and newPassword are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password should be at least 6 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    const isResetTokenValid = await verifyResetToken({
      email: normalizedEmail,
      resetToken,
    });

    if (!isResetTokenValid) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    const lookup = await findAccountByEmail(normalizedEmail);

    if (!lookup.user || !lookup.Model) {
      return NextResponse.json(
        { success: false, message: "Account not found" },
        { status: 404 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await lookup.Model.findOneAndUpdate(
      { email: normalizedEmail },
      { password: hashedPassword },
      { new: true }
    );

    await deleteResetToken({
      email: normalizedEmail,
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
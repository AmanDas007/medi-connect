import { NextResponse } from "next/server";

import connectDB from "@/db/connect";
import { findAccountByEmail } from "@/lib/userLookup";
import { generateOtp, saveOtp, getOtpKey } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mail";

import redis from "@/lib/redis";

export async function POST(req) {
  try {
    await connectDB();

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    const existingOtp = await redis.get(getOtpKey(normalizedEmail));

    if (existingOtp) {
      return NextResponse.json(
        {
          success: false,
          message: "OTP already sent. Please wait 5 minutes before requesting again.",
        },
        { status: 429 }
      );
    }

    const lookup = await findAccountByEmail(normalizedEmail);

    if (lookup.conflict) {
      return NextResponse.json(
        { success: false, message: lookup.message },
        { status: 409 }
      );
    }

    if (!lookup.user || !lookup.Model) {
      return NextResponse.json(
        { success: false, message: "No account found with this email" },
        { status: 404 }
      );
    }

    const userWithPassword = await lookup.Model.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!userWithPassword.password) {
      return NextResponse.json(
        {
          success: false,
          message: "This account uses Google/GitHub login and has no password",
        },
        { status: 400 }
      );
    }

    const otp = generateOtp();

    await saveOtp({
      email: normalizedEmail,
      otp,
    });

    await sendOtpEmail({
      to: normalizedEmail,
      otp,
    });

    return NextResponse.json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
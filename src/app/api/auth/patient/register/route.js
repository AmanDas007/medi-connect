import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import connectDB from "@/db/connect";
import Patient from "@/models/Patient";
import { emailExistsAnywhere } from "@/lib/userLookup";
import { uploadFileToCloudinary } from "@/lib/cloudinary";

export async function POST(req) {
  try {
    await connectDB();
    console.log("coming")
    const formData = await req.formData();

    const name = formData.get("name")?.toString().trim();
    const email = formData.get("email")?.toString().toLowerCase().trim();
    const password = formData.get("password")?.toString();

    const profileImage = formData.get("profileImage");

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Name, email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password should be at least 6 characters" },
        { status: 400 }
      );
    }

    const exists = await emailExistsAnywhere(email);

    if (exists) {
      return NextResponse.json(
        { success: false, message: "Account already exists with this email" },
        { status: 409 }
      );
    }

    let profileUrl = null;
    let profilePublicId = null;

    if (profileImage && profileImage.size > 0) {
      const uploadedProfile = await uploadFileToCloudinary(
        profileImage,
        "medi-connect/patients/profile"
      );

      profileUrl = uploadedProfile?.url || null;
      profilePublicId = uploadedProfile?.publicId || null;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const patient = await Patient.create({
      role: "patient",
      name,
      email,
      password: hashedPassword,
      profileUrl,
      profilePublicId,
      isBlocked: false,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Patient registered successfully",
        patient: {
          id: patient._id,
          role: patient.role,
          name: patient.name,
          email: patient.email,
          profileUrl: patient.profileUrl,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Patient register error:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "Duplicate field value entered" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
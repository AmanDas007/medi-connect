import { NextResponse } from "next/server";

import connectDB from "@/db/connect";
import Patient from "@/models/Patient";
import { requirePatient } from "@/lib/apiAuth";
import {
  uploadFileToCloudinary,
  deleteFileFromCloudinary,
} from "@/lib/cloudinary";

export async function GET() {
  try {
    await connectDB();

    const auth = await requirePatient();

    if (auth.error) return auth.error;

    const patient = await Patient.findById(auth.user.id).select("-password");

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          message: "Patient not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        patient: {
          id: patient._id,
          role: patient.role,
          name: patient.name,
          email: patient.email,
          profileUrl: patient.profileUrl || null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch patient profile error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while fetching profile",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    await connectDB();

    const auth = await requirePatient();

    if (auth.error) return auth.error;

    const formData = await req.formData();

    const name = formData.get("name")?.toString().trim();
    const profileImage = formData.get("profileImage");
    const removeImage = formData.get("removeImage")?.toString() === "true";

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Name is required",
        },
        { status: 400 }
      );
    }

    const patient = await Patient.findById(auth.user.id);

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          message: "Patient not found",
        },
        { status: 404 }
      );
    }

    if (patient.isBlocked) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is blocked",
        },
        { status: 403 }
      );
    }

    patient.name = name;

    // Case 1: user clicked delete image
    if (removeImage) {
      if (patient.profilePublicId) {
        await deleteFileFromCloudinary(patient.profilePublicId);
      }

      patient.profileUrl = null;
      patient.profilePublicId = null;
    }

    // Case 2: user uploaded new image
    if (profileImage && profileImage.size > 0) {
      // delete old image first
      if (patient.profilePublicId) {
        await deleteFileFromCloudinary(patient.profilePublicId);
      }

      const uploadedProfile = await uploadFileToCloudinary(
        profileImage,
        "medi-connect/patients/profile"
      );

      patient.profileUrl = uploadedProfile?.url || null;
      patient.profilePublicId = uploadedProfile?.publicId || null;
    }

    await patient.save();

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        patient: {
          id: patient._id,
          role: patient.role,
          name: patient.name,
          email: patient.email,
          profileUrl: patient.profileUrl || null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update patient profile error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while updating profile",
      },
      { status: 500 }
    );
  }
}
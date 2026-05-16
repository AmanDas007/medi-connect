import { NextResponse } from "next/server";

import connectDB from "@/db/connect";
import Doctor from "@/models/Doctor";
import { requireDoctor } from "@/lib/apiAuth";
import {
  uploadFileToCloudinary,
  deleteFileFromCloudinary,
} from "@/lib/cloudinary";

export async function GET() {
  try {
    await connectDB();

    const auth = await requireDoctor();

    if (auth.error) return auth.error;

    const doctor = await Doctor.findById(auth.user.id).select("-password");

    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "Doctor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        doctor: {
          id: doctor._id,
          role: doctor.role,
          name: doctor.name,
          email: doctor.email,
          profileUrl: doctor.profileUrl || null,
          specialization: doctor.specialization,
          experienceYears: doctor.experienceYears,
          clinic: doctor.clinic,
          consultationFee: doctor.consultationFee,
          availability: doctor.availability,
          averageRating: doctor.averageRating,
          totalFeedbacks: doctor.totalFeedbacks,
          isBlocked: doctor.isBlocked,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch doctor profile error:", error);

    return NextResponse.json(
      { success: false, message: "Something went wrong while fetching profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    await connectDB();

    const auth = await requireDoctor();

    if (auth.error) return auth.error;

    const formData = await req.formData();

    const specialization = formData.get("specialization")?.toString().trim();
    const experienceYears = Number(formData.get("experienceYears") || 0);
    const consultationFee = Number(formData.get("consultationFee"));

    const clinicName = formData.get("clinicName")?.toString().trim();
    const clinicAddress = formData.get("clinicAddress")?.toString().trim();
    const clinicCity = formData.get("clinicCity")?.toString().trim();
    const clinicState = formData.get("clinicState")?.toString().trim();
    const clinicPincode = formData.get("clinicPincode")?.toString().trim();

    const longitudeRaw = formData.get("longitude")?.toString().trim();
    const latitudeRaw = formData.get("latitude")?.toString().trim();

    const profileImage = formData.get("profileImage");
    const removeImage = formData.get("removeImage")?.toString() === "true";

    if (!specialization) {
      return NextResponse.json(
        { success: false, message: "Specialization is required" },
        { status: 400 }
      );
    }

    if (Number.isNaN(experienceYears) || experienceYears < 0) {
      return NextResponse.json(
        { success: false, message: "Experience years must be valid" },
        { status: 400 }
      );
    }

    if (!consultationFee || Number.isNaN(consultationFee) || consultationFee <= 0) {
      return NextResponse.json(
        { success: false, message: "Consultation fee must be valid" },
        { status: 400 }
      );
    }

    if (!clinicName || !clinicAddress || !clinicCity || !clinicState || !clinicPincode) {
      return NextResponse.json(
        {
          success: false,
          message: "Clinic name, address, city, state and pincode are required",
        },
        { status: 400 }
      );
    }

    let longitude = null;
    let latitude = null;

    if (longitudeRaw && latitudeRaw) {
      longitude = Number(longitudeRaw);
      latitude = Number(latitudeRaw);

      if (
        Number.isNaN(longitude) ||
        Number.isNaN(latitude) ||
        longitude < -180 ||
        longitude > 180 ||
        latitude < -90 ||
        latitude > 90
      ) {
        return NextResponse.json(
          { success: false, message: "Invalid longitude or latitude" },
          { status: 400 }
        );
      }
    }

    const doctor = await Doctor.findById(auth.user.id);

    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "Doctor not found" },
        { status: 404 }
      );
    }

    if (doctor.isBlocked) {
      return NextResponse.json(
        { success: false, message: "Your account is blocked" },
        { status: 403 }
      );
    }

    doctor.specialization = specialization;
    doctor.experienceYears = experienceYears;
    doctor.consultationFee = consultationFee;

    doctor.clinic.name = clinicName;
    doctor.clinic.address = clinicAddress;
    doctor.clinic.city = clinicCity;
    doctor.clinic.state = clinicState;
    doctor.clinic.pincode = clinicPincode;

    if (longitudeRaw && latitudeRaw) {
      doctor.clinic.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
    }

    // Case 1: doctor deleted profile image
    if (removeImage) {
      if (doctor.profilePublicId) {
        await deleteFileFromCloudinary(doctor.profilePublicId);
      }

      doctor.profileUrl = null;
      doctor.profilePublicId = null;
    }

    // Case 2: doctor uploaded new profile image
    if (profileImage && profileImage.size > 0) {
      if (doctor.profilePublicId) {
        await deleteFileFromCloudinary(doctor.profilePublicId);
      }

      const uploadedProfile = await uploadFileToCloudinary(
        profileImage,
        "medi-connect/doctors/profile"
      );

      doctor.profileUrl = uploadedProfile?.url || null;
      doctor.profilePublicId = uploadedProfile?.publicId || null;
    }

    await doctor.save();

    return NextResponse.json(
      {
        success: true,
        message: "Doctor profile updated successfully",
        doctor: {
          id: doctor._id,
          role: doctor.role,
          name: doctor.name,
          email: doctor.email,
          profileUrl: doctor.profileUrl || null,
          specialization: doctor.specialization,
          experienceYears: doctor.experienceYears,
          clinic: doctor.clinic,
          consultationFee: doctor.consultationFee,
          availability: doctor.availability,
          averageRating: doctor.averageRating,
          totalFeedbacks: doctor.totalFeedbacks,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update doctor profile error:", error);

    return NextResponse.json(
      { success: false, message: "Something went wrong while updating profile" },
      { status: 500 }
    );
  }
}
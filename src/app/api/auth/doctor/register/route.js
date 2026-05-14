import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import connectDB from "@/db/connect";
import Doctor from "@/models/Doctor";
import { emailExistsAnywhere } from "@/lib/userLookup";
import { uploadFileToCloudinary } from "@/lib/cloudinary";

function safeJsonParse(value, fallback) {
  try {
    if (!value) return fallback;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const formData = await req.formData();

    const name = formData.get("name")?.toString().trim();
    const email = formData.get("email")?.toString().toLowerCase().trim();
    const password = formData.get("password")?.toString();

    const specialization = formData.get("specialization")?.toString().trim();
    const experienceYearsRaw = formData.get("experienceYears")?.toString();
    const consultationFeeRaw = formData.get("consultationFee")?.toString();

    const clinicName = formData.get("clinicName")?.toString().trim();
    const clinicAddress = formData.get("clinicAddress")?.toString().trim();
    const clinicCity = formData.get("clinicCity")?.toString().trim();
    const clinicState = formData.get("clinicState")?.toString().trim();
    const clinicPincode = formData.get("clinicPincode")?.toString().trim();

    const longitudeRaw = formData.get("longitude")?.toString();
    const latitudeRaw = formData.get("latitude")?.toString();

    const availabilityRaw = formData.get("availability")?.toString();

    const profileImage = formData.get("profileImage");
    const licence = formData.get("licence");

    if (
      !name ||
      !email ||
      !password ||
      !specialization ||
      !clinicName ||
      !clinicAddress ||
      !clinicCity ||
      !clinicState ||
      !clinicPincode ||
      !consultationFeeRaw
    ) {
      return NextResponse.json(
        { success: false, message: "Required doctor fields are missing" },
        { status: 400 }
      );
    }

    if (!licence || licence.size <= 0) {
      return NextResponse.json(
        { success: false, message: "Doctor licence file is required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password should be at least 6 characters" },
        { status: 400 }
      );
    }

    const consultationFee = Number(consultationFeeRaw);

    if (Number.isNaN(consultationFee) || consultationFee <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid consultation fee is required" },
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
        "medi-connect/doctors/profile"
      );

      profileUrl = uploadedProfile?.url || null;
      profilePublicId = uploadedProfile?.publicId || null;
    }

    const uploadedLicence = await uploadFileToCloudinary(
      licence,
      "medi-connect/doctors/licence"
    );

    if (!uploadedLicence?.url || !uploadedLicence?.publicId) {
      return NextResponse.json(
        { success: false, message: "Licence upload failed" },
        { status: 500 }
      );
    }

    const experienceYears = Number(experienceYearsRaw || 0);

    const longitude = Number(longitudeRaw);
    const latitude = Number(latitudeRaw);

    const hasValidLocation =
      !Number.isNaN(longitude) &&
      !Number.isNaN(latitude) &&
      longitudeRaw !== undefined &&
      latitudeRaw !== undefined;

    const clinic = {
      name: clinicName,
      address: clinicAddress,
      city: clinicCity,
      state: clinicState,
      pincode: clinicPincode,
    };

    if (hasValidLocation) {
      clinic.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
    }

    const availability = safeJsonParse(availabilityRaw, []);

    const hashedPassword = await bcrypt.hash(password, 10);

    const doctor = await Doctor.create({
      role: "doctor",
      name,
      email,
      password: hashedPassword,
      profileUrl,
      profilePublicId,
      licenceUrl: uploadedLicence.url,
      licencePublicId: uploadedLicence.publicId,
      specialization,
      experienceYears: Number.isNaN(experienceYears) ? 0 : experienceYears,
      clinic,
      consultationFee,
      availability,
      averageRating: 0,
      totalFeedbacks: 0,
      isBlocked: false,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Doctor registered successfully",
        doctor: {
          id: doctor._id,
          role: doctor.role,
          name: doctor.name,
          email: doctor.email,
          profileUrl: doctor.profileUrl,
          licenceUrl: doctor.licenceUrl,
          specialization: doctor.specialization,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Doctor register error:", error);

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
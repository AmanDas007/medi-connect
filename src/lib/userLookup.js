import Patient from "@/models/Patient";
import Doctor from "@/models/Doctor";

export async function findAccountByEmail(email) {
  const normalizedEmail = email.toLowerCase();

  const patient = await Patient.findOne({ email: normalizedEmail });
  const doctor = await Doctor.findOne({ email: normalizedEmail });

  if (patient && doctor) {
    return {
      conflict: true,
      message: "Same email exists as both patient and doctor",
    };
  }

  if (patient) {
    return {
      user: patient,
      role: "patient",
      Model: Patient,
    };
  }

  if (doctor) {
    return {
      user: doctor,
      role: "doctor",
      Model: Doctor,
    };
  }

  return {
    user: null,
    role: null,
    Model: null,
  };
}

export async function emailExistsAnywhere(email) {
  const normalizedEmail = email.toLowerCase();

  const patientExists = await Patient.exists({ email: normalizedEmail });
  const doctorExists = await Doctor.exists({ email: normalizedEmail });

  return Boolean(patientExists || doctorExists);
}
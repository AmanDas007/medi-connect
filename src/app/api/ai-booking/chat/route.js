import { NextResponse } from "next/server";
import groq from "@/lib/groq";
import redis from "@/lib/redis";
import connectDB from "@/db/connect";
import Doctor from "@/models/Doctor";
import Appointment from "@/models/Appointment";

const SPECIALIZATIONS = [
  "General Physician",
  "Cardiologist",
  "Dermatologist",
  "Neurologist",
  "Orthopedic Surgeon",
  "Pediatrician",
  "Gynecologist",
  "Psychiatrist",
  "Ophthalmologist",
  "ENT Specialist",
  "Gastroenterologist",
  "Urologist",
  "Pulmonologist",
  "Endocrinologist",
  "Rheumatologist",
  "Oncologist",
  "Nephrologist",
  "Dentist",
  "Radiologist",
  "Pathologist",
  "Anesthesiologist",
];

const AI_RATE_LIMIT_MAX = Number(process.env.AI_RATE_LIMIT_MAX || 10);
const AI_RATE_LIMIT_WINDOW_SECONDS = Number(
  process.env.AI_RATE_LIMIT_WINDOW_SECONDS || 60
);

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toJsonLine(data) {
  return `${JSON.stringify(data)}\n`;
}

function createStream(handler) {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const send = data => {
        controller.enqueue(encoder.encode(toJsonLine(data)));
      };

      try {
        await handler(send);
        send({ type: "done" });
      } catch (error) {
        console.error("AI booking stream error:", error);
        send({
          type: "error",
          message: "Something went wrong while processing your request.",
        });
      } finally {
        controller.close();
      }
    },
  });
}

async function streamPlainText(send, text) {
  const parts = text.split(/(\s+)/);

  for (const part of parts) {
    if (part) {
      send({ type: "token", text: part });
      await new Promise(resolve => setTimeout(resolve, 8));
    }
  }
}

function getRateLimitKey(req) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfIp = req.headers.get("cf-connecting-ip");
  const userAgent = req.headers.get("user-agent") || "unknown";

  const ip =
    forwardedFor?.split(",")?.[0]?.trim() ||
    realIp ||
    cfIp ||
    "unknown-ip";

  const safeIdentity = `${ip}:${userAgent.slice(0, 80)}`
    .replace(/[^a-zA-Z0-9:._-]/g, "_")
    .slice(0, 180);

  return `rate-limit:ai-booking:${safeIdentity}`;
}

async function checkAiRateLimit(req) {
  if (!redis) {
    return {
      allowed: true,
      limit: AI_RATE_LIMIT_MAX,
      remaining: AI_RATE_LIMIT_MAX,
      resetIn: AI_RATE_LIMIT_WINDOW_SECONDS,
    };
  }

  try {
    const key = getRateLimitKey(req);

    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, AI_RATE_LIMIT_WINDOW_SECONDS);
    }

    let ttl = await redis.ttl(key);

    if (ttl === -1) {
      await redis.expire(key, AI_RATE_LIMIT_WINDOW_SECONDS);
      ttl = AI_RATE_LIMIT_WINDOW_SECONDS;
    }

    const resetIn =
      typeof ttl === "number" && ttl > 0
        ? ttl
        : AI_RATE_LIMIT_WINDOW_SECONDS;

    return {
      allowed: current <= AI_RATE_LIMIT_MAX,
      limit: AI_RATE_LIMIT_MAX,
      remaining: Math.max(0, AI_RATE_LIMIT_MAX - current),
      resetIn,
    };
  } catch (error) {
    console.error("AI rate limit Redis error:", error);

    return {
      allowed: true,
      limit: AI_RATE_LIMIT_MAX,
      remaining: AI_RATE_LIMIT_MAX,
      resetIn: AI_RATE_LIMIT_WINDOW_SECONDS,
    };
  }
}

function createRateLimitResponse(rateLimit) {
  const stream = createStream(async send => {
    await streamPlainText(
      send,
      `You have reached the AI assistant limit of ${rateLimit.limit} requests per minute. Please wait ${rateLimit.resetIn} seconds and try again.`
    );
  });

  return new Response(stream, {
    status: 429,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Retry-After": String(rateLimit.resetIn),
      "X-RateLimit-Limit": String(rateLimit.limit),
      "X-RateLimit-Remaining": String(rateLimit.remaining),
      "X-RateLimit-Reset": String(rateLimit.resetIn),
    },
  });
}

function safeJsonParse(value, fallback = {}) {
  try {
    if (!value) return fallback;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function streamGroqText(send, prompt, fallbackText) {
  if (!groq) {
    await streamPlainText(send, fallbackText);
    return;
  }

  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.2,
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "You are MediConnect's booking assistant. Be concise and safe. Do not diagnose. Do not say the user has a disease. Do not invent doctors, fees, dates, or slots. Only use the facts provided. Always mention that symptoms are not a diagnosis and a qualified doctor should evaluate them.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    let wroteSomething = false;

    for await (const chunk of completion) {
      const text = chunk.choices?.[0]?.delta?.content || "";

      if (text) {
        wroteSomething = true;
        send({ type: "token", text });
      }
    }

    if (!wroteSomething) {
      await streamPlainText(send, fallbackText);
    }
  } catch (error) {
    console.error("Groq streaming error:", error);
    await streamPlainText(send, fallbackText);
  }
}

async function detectUserIntent(message) {
  const text = message.trim();

  if (/^(hi|hii|hello|hey|yo|ok|okay|thanks|thank you)$/i.test(text)) {
    return {
      intent: "not_symptom",
      reply:
        "Please describe your symptoms or health concern, and I will suggest a suitable specialization.",
    };
  }

  if (!groq) {
    return {
      intent: "symptom",
      reply: "",
    };
  }

  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
You are an intent classifier for a clinic booking assistant.

Return only JSON:
{
  "intent": "symptom" or "not_symptom",
  "reply": "short reply if not_symptom, otherwise empty string"
}

Rules:
- Greetings like hi, hello, hey = not_symptom.
- Random non-health text like cake, football, laptop, jokes = not_symptom.
- Health concerns like chest pain, fever, headache, heart beating, skin rash, stomach pain, cancer concern = symptom.
- Do not diagnose.
- If not_symptom, politely ask the user to type symptoms or a health concern.
          `,
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    const parsed = safeJsonParse(raw, {});

    if (parsed.intent !== "symptom") {
      return {
        intent: "not_symptom",
        reply:
          parsed.reply ||
          "Please describe your symptoms or health concern, and I will suggest a suitable specialization.",
      };
    }

    return {
      intent: "symptom",
      reply: "",
    };
  } catch {
    return {
      intent: "not_symptom",
      reply:
        "Please describe your symptoms or health concern, and I will suggest a suitable specialization.",
    };
  }
}

function getRuleBasedSpecialization(symptoms) {
  const text = symptoms.toLowerCase();

  if (
    text.includes("cough") ||
    text.includes("cold") ||
    text.includes("fever") ||
    text.includes("throat") ||
    text.includes("weakness") ||
    text.includes("body pain") ||
    text.includes("headache") ||
    text.includes("vomit") ||
    text.includes("loose motion") ||
    text.includes("diarrhea") ||
    text.includes("stomach pain")
  ) {
    return {
      specialization: "General Physician",
      confidence: 0.9,
      reason:
        "Common or first-contact symptoms are best evaluated first by a general physician.",
      emergencyWarning:
        text.includes("breathless") || text.includes("blood")
          ? "If cough is associated with breathing difficulty, blood in cough, severe chest pain, or very high fever, seek urgent medical help."
          : "",
    };
  }

  return null;
}

async function classifySymptoms(symptoms) {
  const ruleBased = getRuleBasedSpecialization(symptoms);

  if (ruleBased) {
    return ruleBased;
  }

  if (!groq) {
    throw new Error("Groq API key missing");
  }

  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
You classify patient symptoms into ONE specialization from this fixed list only:
${SPECIALIZATIONS.join(", ")}

Return only JSON:
{
  "specialization": "one specialization from list",
  "confidence": number between 0 and 1,
  "reason": "short reason",
  "emergencyWarning": "short warning if symptoms may be urgent, else empty string"
}

Very important routing rules:
- Common first-contact symptoms like cough, cold, fever, weakness, body pain, mild headache, throat pain, vomiting, diarrhea, general stomach pain => General Physician.
- Do NOT send simple cough/cold/fever to Pulmonologist unless symptoms include severe breathing difficulty, chronic lung disease, asthma/COPD, coughing blood, or long-term persistent cough.
- Heart beating, palpitations, chest pain, high BP concern => Cardiologist.
- Skin rash, acne, itching, skin allergy => Dermatologist.
- Bone pain, joint pain, fracture, knee/back pain => Orthopedic Surgeon.
- Anxiety, stress, depression, panic attacks => Psychiatrist.
- Cancer concern, tumor, chemotherapy-related query => Oncologist.
- If symptoms are unclear or mixed, choose General Physician.

Safety:
- Do not diagnose.
- Do not say the user has a disease.
- If symptoms may be emergency, include emergencyWarning.
          `,
        },
        {
          role: "user",
          content: symptoms,
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    const parsed = safeJsonParse(raw, {});

    const specialization = SPECIALIZATIONS.includes(parsed.specialization)
      ? parsed.specialization
      : "General Physician";

    return {
      specialization,
      confidence:
        typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      reason: parsed.reason || "",
      emergencyWarning: parsed.emergencyWarning || "",
    };
  } catch (error) {
    console.error("Symptom classification error:", error);

    return {
      specialization: "General Physician",
      confidence: 0.4,
      reason: "Could not confidently classify symptoms.",
      emergencyWarning: "",
    };
  }
}

function normalizeSpecializationDisplay(value) {
  if (Array.isArray(value)) return value.join(", ");
  return value || "";
}

function buildSpecializationQuery(specialization) {
  const pattern = `^${escapeRegex(specialization)}$`;

  return {
    $or: [
      { specialization: new RegExp(pattern, "i") },
      {
        specialization: {
          $elemMatch: {
            $regex: pattern,
            $options: "i",
          },
        },
      },
    ],
  };
}

function safeDoctor(doctor, extra = {}) {
  return {
    _id: doctor._id?.toString(),
    name: doctor.name,
    profileUrl: doctor.profileUrl || null,
    specialization: normalizeSpecializationDisplay(doctor.specialization),
    experienceYears: doctor.experienceYears || 0,
    consultationFee: doctor.consultationFee || 0,
    averageRating: doctor.averageRating || 0,
    totalFeedbacks: doctor.totalFeedbacks || 0,
    clinic: {
      name: doctor.clinic?.name || "Clinic",
      address: doctor.clinic?.address || "",
      city: doctor.clinic?.city || "",
      state: doctor.clinic?.state || "",
      pincode: doctor.clinic?.pincode || "",
    },
    ...extra,
  };
}

function getISTDate(dateString) {
  return new Date(`${dateString}T00:00:00+05:30`);
}

function createDateTimeIST(dateString, timeString) {
  return new Date(`${dateString}T${timeString}:00+05:30`);
}

function getDateStringIST(date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function getDateLabelIST(date) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function formatTimeIST(dateValue) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  }).format(new Date(dateValue));
}

function getTimeMinutes(time) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

async function getTopDoctorsBySpecialization(specialization) {
  return Doctor.find({
    isBlocked: false,
    ...buildSpecializationQuery(specialization),
  })
    .select(
      "name profileUrl specialization experienceYears consultationFee averageRating totalFeedbacks clinic availability"
    )
    .sort({
      averageRating: -1,
      totalFeedbacks: -1,
      experienceYears: -1,
      consultationFee: 1,
    })
    .limit(10)
    .lean();
}

async function getNearbyDoctorsBySpecialization(specialization, latitude, longitude) {
  const doctors = await Doctor.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        distanceField: "distanceMeters",
        spherical: true,
        maxDistance: 25000,
        query: {
          isBlocked: false,
          ...buildSpecializationQuery(specialization),
          "clinic.location.coordinates.0": { $exists: true },
          "clinic.location.coordinates.1": { $exists: true },
        },
      },
    },
    {
      $project: {
        name: 1,
        profileUrl: 1,
        specialization: 1,
        experienceYears: 1,
        consultationFee: 1,
        averageRating: 1,
        totalFeedbacks: 1,
        clinic: 1,
        availability: 1,
        distanceMeters: 1,
      },
    },
    {
      $limit: 30,
    },
  ]);

  return doctors;
}

async function getAvailableSlotsForDate(doctor, dateString) {
  if (!dateString) return [];

  const selectedDate = getISTDate(dateString);
  const dayOfWeek = selectedDate.getDay();

  const availability = doctor.availability?.find(
    day => day.dayOfWeek === dayOfWeek && day.isAvailable
  );

  if (!availability?.slots?.length) return [];

  const startOfDay = createDateTimeIST(dateString, "00:00");
  const endOfDay = createDateTimeIST(dateString, "23:59");
  const now = new Date();

  const blockingAppointments = await Appointment.find({
    doctor: doctor._id,
    slotStart: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
    $or: [
      { status: "confirmed" },
      {
        status: "pending-payment",
        paymentExpiresAt: { $gt: now },
      },
    ],
  })
    .select("slotStart slotEnd")
    .lean();

  const bookedLabels = new Set(
    blockingAppointments.map(item => {
      return `${formatTimeIST(item.slotStart)} - ${formatTimeIST(item.slotEnd)}`;
    })
  );

  return [...availability.slots]
    .sort((a, b) => getTimeMinutes(a.startTime) - getTimeMinutes(b.startTime))
    .filter(slot => {
      const slotStart = createDateTimeIST(dateString, slot.startTime);
      const label = `${slot.startTime} - ${slot.endTime}`;

      if (slotStart.getTime() <= now.getTime()) return false;
      if (bookedLabels.has(label)) return false;

      return true;
    })
    .map(slot => ({
      label: `${slot.startTime} - ${slot.endTime}`,
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));
}

async function getAvailableDatesForDoctor(doctor) {
  const dates = [];

  for (let index = 0; index < 7; index++) {
    const date = new Date();
    date.setDate(date.getDate() + index);

    const dateString = getDateStringIST(date);
    const availableSlots = await getAvailableSlotsForDate(doctor, dateString);

    if (availableSlots.length > 0) {
      dates.push({
        date: dateString,
        label: index === 0 ? "Today" : getDateLabelIST(date),
        availableSlotsCount: availableSlots.length,
      });
    }
  }

  return dates;
}

export async function POST(req) {
  const rateLimit = await checkAiRateLimit(req);

  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit);
  }

  await connectDB();

  const body = await req.json();

  const action = body.action || "message";
  const message = body.message?.toString().trim() || "";
  const context = body.context || {};

  const latitude = Number(body.location?.latitude);
  const longitude = Number(body.location?.longitude);

  const stream = createStream(async send => {
    if (action === "message") {
      if (!message) {
        await streamPlainText(
          send,
          "Please describe your symptoms or health concern, and I will suggest a suitable specialization."
        );
        return;
      }

      if (!groq) {
        await streamPlainText(
          send,
          "AI is not configured yet. Please add GROQ_API_KEY in your environment variables."
        );
        return;
      }

      const intent = await detectUserIntent(message);

      if (intent.intent !== "symptom") {
        await streamPlainText(send, intent.reply);
        return;
      }

      const result = await classifySymptoms(message);
      const doctors = await getTopDoctorsBySpecialization(result.specialization);

      send({
        type: "context",
        patch: {
          stage: "doctors_shown",
          symptoms: message,
          specialization: result.specialization,
          selectedDoctor: null,
          selectedDate: "",
          selectedSlot: null,
        },
      });

      const fallbackText = `${
        result.emergencyWarning ? `${result.emergencyWarning} ` : ""
      }Based on your symptoms, ${result.specialization} may be a suitable specialization. This is not a diagnosis. Please consult a qualified doctor. I found ${doctors.length} doctor(s) for this specialization.`;

      await streamGroqText(
        send,
        `
Symptoms: ${message}
Suggested specialization: ${result.specialization}
Reason: ${result.reason}
Emergency warning: ${result.emergencyWarning || "none"}
Doctors found: ${doctors.length}

Write a short safe response.
Do not say the user has a disease.
Do not diagnose.
Mention that this is not a diagnosis.
        `,
        fallbackText
      );

      send({
        type: "options",
        kind: "doctors",
        doctors: doctors.map(doctor => safeDoctor(doctor)),
        specialization: result.specialization,
        allowNearby: true,
      });

      return;
    }

    if (action === "nearby") {
      if (!context.specialization) {
        await streamPlainText(
          send,
          "Please describe your symptoms first so I can decide the suitable specialization."
        );
        return;
      }

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        await streamPlainText(
          send,
          "Please allow location access first, then I can show nearby doctors for this specialization."
        );

        send({
          type: "location_required",
        });

        return;
      }

      const doctors = await getNearbyDoctorsBySpecialization(
        context.specialization,
        latitude,
        longitude
      );

      send({
        type: "context",
        patch: {
          stage: "nearby_doctors_shown",
        },
      });

      await streamPlainText(
        send,
        doctors.length > 0
          ? `I found ${doctors.length} nearby doctor(s) for ${context.specialization}, sorted by nearest distance. Please choose one doctor to continue.`
          : `I could not find nearby doctors for ${context.specialization}. You can choose from the top doctors list instead.`
      );

      send({
        type: "options",
        kind: "doctors",
        doctors: doctors.map((doctor, index) =>
          safeDoctor(doctor, {
            nearbyRank: index + 1,
            distanceMeters: Math.round(doctor.distanceMeters || 0),
            distanceKm: Number(((doctor.distanceMeters || 0) / 1000).toFixed(2)),
          })
        ),
        specialization: context.specialization,
        allowNearby: false,
      });

      return;
    }

    if (action === "selectDoctor") {
      const doctorId = body.doctorId || context.selectedDoctor?._id;

      const doctor = await Doctor.findById(doctorId)
        .select(
          "name profileUrl specialization experienceYears consultationFee averageRating totalFeedbacks clinic availability isBlocked"
        )
        .lean();

      if (!doctor || doctor.isBlocked) {
        await streamPlainText(
          send,
          "This doctor is currently not available. Please choose another doctor."
        );
        return;
      }

      const dates = await getAvailableDatesForDoctor(doctor);

      send({
        type: "context",
        patch: {
          stage: "doctor_selected",
          selectedDoctor: safeDoctor(doctor),
          selectedDate: "",
          selectedSlot: null,
        },
      });

      await streamPlainText(
        send,
        dates.length > 0
          ? `You selected ${doctor.name}. Please choose one available date within the next 7 days.`
          : `${doctor.name} has no available slots in the next 7 days. Please choose another doctor.`
      );

      send({
        type: "options",
        kind: "dates",
        doctorId: doctor._id.toString(),
        doctor: safeDoctor(doctor),
        dates,
      });

      return;
    }

    if (action === "selectDate") {
      const doctorId = body.doctorId || context.selectedDoctor?._id;
      const selectedDate = body.date;

      const doctor = await Doctor.findById(doctorId)
        .select(
          "name profileUrl specialization experienceYears consultationFee averageRating totalFeedbacks clinic availability isBlocked"
        )
        .lean();

      if (!doctor || doctor.isBlocked) {
        await streamPlainText(
          send,
          "This doctor is currently not available. Please choose another doctor."
        );
        return;
      }

      const slots = await getAvailableSlotsForDate(doctor, selectedDate);

      send({
        type: "context",
        patch: {
          stage: "date_selected",
          selectedDoctor: safeDoctor(doctor),
          selectedDate,
          selectedSlot: null,
        },
      });

      await streamPlainText(
        send,
        slots.length > 0
          ? `Here are the available slots for ${doctor.name} on ${selectedDate}. Please choose one slot.`
          : `No slots are available on ${selectedDate}. Please choose another date.`
      );

      send({
        type: "options",
        kind: "slots",
        doctorId: doctor._id.toString(),
        doctor: safeDoctor(doctor),
        date: selectedDate,
        slots,
      });

      return;
    }

    if (action === "selectSlot") {
      const selectedSlot = body.slot;
      const selectedDoctor = body.doctor || context.selectedDoctor;
      const selectedDate = body.date || context.selectedDate;

      if (!selectedDoctor?._id || !selectedDate || !selectedSlot?.label) {
        await streamPlainText(
          send,
          "Booking details are incomplete. Please choose doctor, date, and slot again."
        );
        return;
      }

      const doctor = await Doctor.findById(selectedDoctor._id)
        .select(
          "name profileUrl specialization experienceYears consultationFee averageRating totalFeedbacks clinic availability isBlocked"
        )
        .lean();

      if (!doctor || doctor.isBlocked) {
        await streamPlainText(
          send,
          "This doctor is currently not available. Please choose another doctor."
        );
        return;
      }

      const availableSlots = await getAvailableSlotsForDate(doctor, selectedDate);
      const stillAvailable = availableSlots.some(
        slot => slot.label === selectedSlot.label
      );

      if (!stillAvailable) {
        await streamPlainText(
          send,
          "This slot is no longer available. Please choose another available slot."
        );

        send({
          type: "options",
          kind: "slots",
          doctorId: doctor._id.toString(),
          doctor: safeDoctor(doctor),
          date: selectedDate,
          slots: availableSlots,
        });

        return;
      }

      send({
        type: "context",
        patch: {
          stage: "slot_selected",
          selectedDoctor: safeDoctor(doctor),
          selectedDate,
          selectedSlot,
        },
      });

      await streamPlainText(
        send,
        "Great. Please review the booking summary below. If everything looks correct, click Pay Now to complete the booking."
      );

      send({
        type: "options",
        kind: "summary",
        summary: {
          doctor: safeDoctor(doctor),
          date: selectedDate,
          slot: selectedSlot,
          mode: "offline",
          amount: doctor.consultationFee || 0,
        },
      });

      return;
    }

    await streamPlainText(
      send,
      "Please describe your symptoms, and I will help you find the right doctor."
    );
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
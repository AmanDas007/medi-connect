import bcrypt from "bcryptjs";
import crypto from "crypto";
import { redis } from "@/lib/redis";

export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getOtpKey(email) {
  return `forgot-password:otp:${email.toLowerCase()}`;
}

export function getResetTokenKey(email) {
  return `forgot-password:reset-token:${email.toLowerCase()}`;
}

export async function saveOtp({ email, otp }) {
  const key = getOtpKey(email);
  const hashedOtp = await bcrypt.hash(otp, 10);

  await redis.set(key, hashedOtp, {
    ex: 5 * 60,
  });
}

export async function verifyOtp({ email, otp }) {
  const key = getOtpKey(email);
  const hashedOtp = await redis.get(key);

  if (!hashedOtp) return false;

  return bcrypt.compare(otp, hashedOtp);
}

export async function deleteOtp({ email }) {
  await redis.del(getOtpKey(email));
}

export async function createResetToken({ email }) {
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedResetToken = await bcrypt.hash(resetToken, 10);

  await redis.set(getResetTokenKey(email), hashedResetToken, {
    ex: 10 * 60,
  });

  return resetToken;
}

export async function verifyResetToken({ email, resetToken }) {
  const hashedResetToken = await redis.get(getResetTokenKey(email));

  if (!hashedResetToken) return false;

  return bcrypt.compare(resetToken, hashedResetToken);
}

export async function deleteResetToken({ email }) {
  await redis.del(getResetTokenKey(email));
}
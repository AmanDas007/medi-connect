import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOtpEmail({ to, otp }) {
  await transporter.sendMail({
    from: `"Medi-Connect" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Medi-Connect Password Reset OTP",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Password Reset OTP</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP will expire in 5 minutes.</p>
      </div>
    `,
  });
}
import nodemailer from "nodemailer";
import { envVars } from "../config"; // adjust path if needed

const host = envVars.SMTP_HOST;
const port = Number(envVars.SMTP_PORT || "587");
const user = envVars.SMTP_USER;
const pass = envVars.SMTP_PASS;

export const mailFrom = envVars.SMTP_FROM || user;

export const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465, // 465 => true, 587 => false
  auth: { user, pass },
});

export async function verifyMailer() {
  await transporter.verify();
  console.log("✅ SMTP transporter ready");
}

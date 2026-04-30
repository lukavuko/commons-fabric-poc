import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const FROM_EMAIL = process.env.FROM_EMAIL ?? "noreply@commonsfabric.app";
const APP_URL = process.env.APP_URL ?? "http://localhost:5173";

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const link = `${APP_URL}/verify-email?token=${token}`;
  await sgMail.send({
    to,
    from: FROM_EMAIL,
    subject: "Verify your Commons Fabric email",
    text: `Verify your email: ${link}`,
    html: `<p>Click to verify your email: <a href="${link}">Verify Email</a></p>`,
  });
}

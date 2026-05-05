import sgMail from "@sendgrid/mail";

/**
 * Email transport.
 *
 *   EMAIL_TRANSPORT=console (default in dev)  → logs verification links to stdout, no network calls.
 *   EMAIL_TRANSPORT=sendgrid                  → sends real mail via Sendgrid.
 *
 * To switch back to real Sendgrid delivery:
 *   1. Set `EMAIL_TRANSPORT=sendgrid` in .env (or in the auth service's environment).
 *   2. Set `SENDGRID_API_KEY` to a valid key with the Mail Send permission.
 *   3. Set `SENDGRID_FROM_EMAIL` to a sender that is verified in your Sendgrid
 *      account (Single Sender Verification or Domain Authentication). Sendgrid
 *      returns 403 Forbidden if the sender is not verified — that surfaced
 *      during Slice 1 smoke-testing and is why this console fallback exists.
 *   4. Restart the auth container.
 */

const TRANSPORT = (process.env.EMAIL_TRANSPORT ?? "console").toLowerCase();
const FROM_EMAIL =
  process.env.SENDGRID_FROM_EMAIL ??
  process.env.FROM_EMAIL ??
  "noreply@commonsfabric.app";
const APP_URL = process.env.APP_URL ?? "http://localhost:5173";

if (TRANSPORT === "sendgrid") {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error(
      "EMAIL_TRANSPORT=sendgrid requires SENDGRID_API_KEY to be set",
    );
  }
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function sendVerificationEmail(
  to: string,
  token: string,
): Promise<void> {
  const link = `${APP_URL}/verify-email?token=${token}`;

  if (TRANSPORT === "console") {
    // eslint-disable-next-line no-console
    console.log(
      `[email:console] verification link for ${to}\n  ${link}\n  (set EMAIL_TRANSPORT=sendgrid to deliver via Sendgrid)`,
    );
    return;
  }

  await sgMail.send({
    to,
    from: FROM_EMAIL,
    subject: "Verify your Commons Fabric email",
    text: `Verify your email: ${link}`,
    html: `<p>Click to verify your email: <a href="${link}">Verify Email</a></p>`,
  });
}

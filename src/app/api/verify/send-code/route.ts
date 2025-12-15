import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  console.log("[send-code] Request received");

  try {
    const body = await request.json();
    console.log("[send-code] Request body:", { email: body.email, networkName: body.networkName });

    const { email, networkName } = body;

    if (!email || !networkName) {
      console.log("[send-code] Missing required fields");
      return Response.json(
        { error: "Email and network name are required" },
        { status: 400 }
      );
    }

    // Generate a 6-digit code (mocked for now - not stored anywhere)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("[send-code] Generated code:", code);

    console.log("[send-code] Sending email via Resend...");
    console.log("[send-code] API key present:", !!process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: "Founder Tea <founder-tea@resend.dev>",
      to: [email],
      subject: `${code} is your verification code`,
      html: `
        <div style="font-family: system-ui, sans-serif; padding: 40px 20px; max-width: 480px;">
          <h1 style="font-size: 24px; margin-bottom: 24px;">Your verification code</h1>
          <p style="color: #666; margin-bottom: 24px;">
            Use this code to prove your membership in <strong>${networkName}</strong>.
          </p>
          <div style="background: #f4f4f5; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px; font-family: monospace; font-weight: bold; letter-spacing: 0.25em;">
              ${code}
            </span>
          </div>
          <p style="font-size: 14px; color: #888;">
            This email is only used for verification. We don't store your email address.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("[send-code] Resend error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    console.log("[send-code] Email sent successfully:", data);

    return Response.json({
      success: true,
      messageId: data?.id,
      // Return code for testing (remove in production!)
      code
    });
  } catch (error) {
    console.error("[send-code] API error:", error);
    return Response.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}

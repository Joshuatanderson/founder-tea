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
        <div style="font-family: system-ui, -apple-system, sans-serif; background: #1c1917; color: #fafaf9; padding: 48px 24px; max-width: 480px; margin: 0 auto; text-align: center;">
          <div style="margin-bottom: 40px;">
            <span style="font-size: 20px; font-weight: 600; letter-spacing: -0.025em;">founder<span style="color: #d946ef;">tea</span></span>
          </div>

          <h1 style="font-size: 28px; font-weight: 700; margin: 0 0 12px 0; color: #fafaf9; letter-spacing: -0.025em;">
            Your verification code
          </h1>

          <p style="color: #a8a29e; margin: 0 0 32px 0; line-height: 1.6; font-size: 15px;">
            Prove your membership in <span style="color: #d946ef; font-weight: 500;">${networkName}</span>
          </p>

          <div style="background: #292524; border: 1px solid #44403c; border-radius: 16px; padding: 32px; margin: 0 0 32px 0;">
            <span style="font-size: 40px; font-family: ui-monospace, SFMono-Regular, monospace; font-weight: 700; letter-spacing: 0.35em; color: #fafaf9;">
              ${code}
            </span>
          </div>

          <p style="font-size: 13px; color: #78716c; line-height: 1.6; margin: 0 0 8px 0;">
            Expires in 10 minutes
          </p>

          <p style="font-size: 13px; color: #57534e; line-height: 1.6; margin: 0;">
            Your email is never stored or tracked by foundertea.
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

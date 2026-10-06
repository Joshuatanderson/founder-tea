import { Resend } from "resend";
import { createChallenge } from "@/lib/verification";
import { sql } from "@/lib/db";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  console.log("[send-code] Request received");

  try {
    const body = await request.json();
    console.log("[send-code] Request body:", { email: body.email });

    const { email } = body;

    if (!email) {
      console.log("[send-code] Missing email");
      return Response.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Extract domain from email
    const domain = email.toLowerCase().split("@")[1];
    if (!domain) {
      return Response.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Verify domain exists in at least one validation group
    const groups = await sql<{ id: string; name: string }>`
      select distinct g.id, g.name
      from validation_group_member m
      join validation_group g on g.id = m.validation_group_id
      where m.domain = ${domain}
      order by g.name`;

    if (groups.length === 0) {
      console.log("[send-code] Domain not found:", { domain });
      return Response.json(
        { error: "Email domain not associated with any accelerator" },
        { status: 403 }
      );
    }

    console.log("[send-code] Domain found in groups:", groups.map(g => g.name));

    // Create stateless challenge (email only, no groupId binding)
    const challenge = createChallenge(email);
    console.log("[send-code] Generated challenge, code:", challenge.code);

    console.log("[send-code] Sending email via Resend...");
    console.log("[send-code] API key present:", !!process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: "Founder Tea <verification@foundertea.com>",
      to: [email],
      subject: `${challenge.code} is your verification code`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; background: #1c1917; color: #fafaf9; padding: 48px 24px; max-width: 480px; margin: 0 auto; text-align: center;">
          <div style="margin-bottom: 40px;">
            <span style="font-size: 20px; font-weight: 600; letter-spacing: -0.025em;">founder<span style="color: #d946ef;">tea</span></span>
          </div>

          <h1 style="font-size: 28px; font-weight: 700; margin: 0 0 12px 0; color: #fafaf9; letter-spacing: -0.025em;">
            Your verification code
          </h1>

          <p style="color: #a8a29e; margin: 0 0 32px 0; line-height: 1.6; font-size: 15px;">
            Use this code to verify your email address
          </p>

          <div style="background: #292524; border: 1px solid #44403c; border-radius: 16px; padding: 32px; margin: 0 0 32px 0;">
            <span style="font-size: 40px; font-family: ui-monospace, SFMono-Regular, monospace; font-weight: 700; letter-spacing: 0.35em; color: #fafaf9;">
              ${challenge.code}
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

    // Return token and eligible groups to client
    return Response.json({
      success: true,
      token: challenge.token,
      expiresAt: challenge.expiresAt,
      eligibleGroups: groups,
    });
  } catch (error) {
    console.error("[send-code] API error:", error);
    return Response.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}

import { verifyChallenge } from "@/lib/verification";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
);

export async function POST(request: Request) {
  console.log("[confirm] Request received");

  try {
    const body = await request.json();
    const { token, email, code, groupId, commitment } = body;

    console.log("[confirm] Verifying:", {
      hasToken: !!token,
      hasEmail: !!email,
      hasCode: !!code,
      hasGroupId: !!groupId,
      hasCommitment: !!commitment
    });

    // Validate inputs exist
    if (!token || !email || !code) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify the challenge (just validates email + code + expiry)
    const result = verifyChallenge(token, email, code);
    console.log("[confirm] Verification result:", result);

    if (!result.valid) {
      return Response.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // If commitment provided, store it (requires groupId)
    if (commitment) {
      if (!groupId) {
        return Response.json(
          { error: "Group ID required when storing commitment" },
          { status: 400 }
        );
      }

      // Validate commitment format (should be a bigint-compatible string)
      if (!/^\d+$/.test(commitment)) {
        return Response.json(
          { error: "Invalid commitment format" },
          { status: 400 }
        );
      }

      // Check if commitment already exists
      const { data: existing } = await supabase
        .from("identity_commitment")
        .select("id")
        .eq("commitment", commitment)
        .single();

      if (existing) {
        console.log("[confirm] Commitment already exists");
        return Response.json({
          success: true,
          alreadyVerified: true,
        });
      }

      // Store the commitment
      const { error: insertError } = await supabase
        .from("identity_commitment")
        .insert({
          validation_group_id: groupId,
          commitment: commitment,
        });

      if (insertError) {
        console.error("[confirm] Failed to store commitment:", insertError);
        return Response.json(
          { error: "Failed to store commitment" },
          { status: 500 }
        );
      }

      console.log("[confirm] Commitment stored successfully");
    }

    // Success - return verified email so client can look up eligible groups
    return Response.json({
      success: true,
      verifiedEmail: result.email,
    });
  } catch (error) {
    console.error("[confirm] API error:", error);
    return Response.json(
      { error: "Failed to verify code" },
      { status: 500 }
    );
  }
}

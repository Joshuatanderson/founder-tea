import { verifyChallenge } from "@/lib/verification";
import { sql, isUuid } from "@/lib/db";

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

      // Extract domain from verified email and validate group membership
      const domain = result.email!.split("@")[1];
      const memberships = isUuid(groupId)
        ? await sql`
            select id from validation_group_member
            where domain = ${domain} and validation_group_id = ${groupId}`
        : [];

      if (memberships.length === 0) {
        console.log("[confirm] Domain not in requested group:", { domain, groupId });
        return Response.json(
          { error: "Email domain not eligible for this group" },
          { status: 403 }
        );
      }

      // Check if commitment already exists
      const existing = await sql`
        select id from identity_commitment where commitment = ${commitment}`;

      if (existing.length > 0) {
        console.log("[confirm] Commitment already exists");
        return Response.json({
          success: true,
          alreadyVerified: true,
        });
      }

      // Store the commitment
      await sql`
        insert into identity_commitment (validation_group_id, commitment)
        values (${groupId}, ${commitment})`;

      console.log("[confirm] Commitment stored successfully for group:", groupId);
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

import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  console.log("[reviews] Request received");

  try {
    const body = await request.json();
    const { vcId, validationGroupId, nullifier, content } = body;

    console.log("[reviews] Creating review:", {
      vcId,
      validationGroupId,
      hasNullifier: !!nullifier,
      contentLength: content?.length,
    });

    // Validate inputs
    if (!vcId || !validationGroupId || !nullifier || !content) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate content length
    if (content.length < 10) {
      return Response.json(
        { error: "Review must be at least 10 characters" },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return Response.json(
        { error: "Review must be less than 5000 characters" },
        { status: 400 }
      );
    }

    // Check if VC exists
    const { data: vc, error: vcError } = await supabase
      .from("vc")
      .select("id")
      .eq("id", vcId)
      .single();

    if (vcError || !vc) {
      console.log("[reviews] VC not found:", vcId);
      return Response.json({ error: "VC not found" }, { status: 404 });
    }

    // Check if validation group exists
    const { data: group, error: groupError } = await supabase
      .from("validation_group")
      .select("id")
      .eq("id", validationGroupId)
      .single();

    if (groupError || !group) {
      console.log("[reviews] Validation group not found:", validationGroupId);
      return Response.json(
        { error: "Validation group not found" },
        { status: 404 }
      );
    }

    // Insert review (nullifier unique constraint handles duplicates)
    const { data: review, error: insertError } = await supabase
      .from("review")
      .insert({
        vc_id: vcId,
        validation_group_id: validationGroupId,
        nullifier,
        content,
      })
      .select("id")
      .single();

    if (insertError) {
      // Check for unique constraint violation (duplicate nullifier)
      if (insertError.code === "23505") {
        console.log("[reviews] Duplicate review detected:", nullifier);
        return Response.json(
          { error: "You have already reviewed this VC" },
          { status: 409 }
        );
      }

      console.error("[reviews] Insert error:", insertError);
      return Response.json(
        { error: "Failed to create review" },
        { status: 500 }
      );
    }

    console.log("[reviews] Review created:", review.id);

    return Response.json({
      success: true,
      reviewId: review.id,
    });
  } catch (error) {
    console.error("[reviews] API error:", error);
    return Response.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}

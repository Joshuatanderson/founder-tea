import { createClient } from "@supabase/supabase-js";
import { Group } from "@semaphore-protocol/group";

// Server-side Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Type for the Semaphore proof object (verification happens client-side)
type SemaphoreProof = {
  merkleTreeDepth: number;
  merkleTreeRoot: string;
  nullifier: string;
  message: string;
  scope: string;
  points: string[];
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vcId, validationGroupId, proof, content } = body;

    // Validate inputs
    if (!vcId || !validationGroupId || !proof || !content) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate content length
    if (content.length < 10) {
      return Response.json(
        { error: "Review must be at least 10 characters" },
        { status: 400 },
      );
    }

    if (content.length > 5000) {
      return Response.json(
        { error: "Review must be less than 5000 characters" },
        { status: 400 },
      );
    }

    // Check if VC exists
    const { data: vc, error: vcError } = await supabase
      .from("vc")
      .select("id")
      .eq("id", vcId)
      .single();

    if (vcError || !vc) {
      return Response.json({ error: "VC not found" }, { status: 404 });
    }

    // Check if validation group exists
    const { data: group, error: groupError } = await supabase
      .from("validation_group")
      .select("id")
      .eq("id", validationGroupId)
      .single();

    if (groupError || !group) {
      return Response.json(
        { error: "Validation group not found" },
        { status: 404 },
      );
    }

    // Fetch all commitments for this validation group to build Merkle tree
    // IMPORTANT: Must use same ordering as /api/groups/[id]/commitments for consistent Merkle root
    const { data: commitments, error: commitmentsError } = await supabase
      .from("identity_commitment")
      .select("commitment")
      .eq("validation_group_id", validationGroupId)
      .order("created_at", { ascending: true });

    if (commitmentsError) {
      console.error("[reviews] Failed to fetch commitments:", commitmentsError);
      return Response.json(
        { error: "Failed to verify proof" },
        { status: 500 },
      );
    }

    if (!commitments || commitments.length === 0) {
      return Response.json(
        { error: "No verified members in this group" },
        { status: 400 },
      );
    }

    // Build Merkle tree from commitments to verify root matches
    const semaphoreGroup = new Group();
    for (const c of commitments) {
      semaphoreGroup.addMember(BigInt(c.commitment));
    }

    // Verify the Merkle root matches (ZK proof verified client-side)
    if (semaphoreGroup.root.toString() !== proof.merkleTreeRoot) {
      console.error("[reviews] Merkle root mismatch - server:", semaphoreGroup.root.toString(), "client:", proof.merkleTreeRoot);
      return Response.json(
        { error: "Invalid proof: group state has changed" },
        { status: 403 },
      );
    }

    const nullifier = proof.nullifier;

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
        return Response.json(
          { error: "You have already reviewed this VC" },
          { status: 409 },
        );
      }

      console.error("[reviews] Insert error:", insertError);
      return Response.json(
        { error: "Failed to create review" },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      reviewId: review.id,
    });
  } catch (error) {
    console.error("[reviews] API error:", error);
    return Response.json({ error: "Failed to create review" }, { status: 500 });
  }
}

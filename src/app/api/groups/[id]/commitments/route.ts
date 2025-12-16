import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params;

  if (!groupId) {
    return Response.json({ error: "Group ID required" }, { status: 400 });
  }

  // Verify the group exists
  const { data: group, error: groupError } = await supabase
    .from("validation_group")
    .select("id")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    return Response.json({ error: "Group not found" }, { status: 404 });
  }

  // Fetch all commitments for this group (ordered for consistent Merkle tree)
  const { data: commitments, error: commitmentsError } = await supabase
    .from("identity_commitment")
    .select("commitment")
    .eq("validation_group_id", groupId)
    .order("created_at", { ascending: true });

  if (commitmentsError) {
    console.error("[commitments] Error fetching commitments:", commitmentsError);
    return Response.json(
      { error: "Failed to fetch commitments" },
      { status: 500 }
    );
  }

  // Return just the commitment strings
  return Response.json({
    commitments: commitments?.map((c) => c.commitment) || [],
  });
}

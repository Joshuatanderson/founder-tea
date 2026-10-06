import { sql, isUuid } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params;

  if (!groupId) {
    return Response.json({ error: "Group ID required" }, { status: 400 });
  }

  try {
    // Verify the group exists
    const groups = isUuid(groupId)
      ? await sql`select id from validation_group where id = ${groupId}`
      : [];

    if (groups.length === 0) {
      return Response.json({ error: "Group not found" }, { status: 404 });
    }

    // Fetch all commitments for this group (ordered for consistent Merkle tree)
    const commitments = await sql<{ commitment: string }>`
      select commitment from identity_commitment
      where validation_group_id = ${groupId}
      order by created_at asc`;

    // Return just the commitment strings
    return Response.json({
      commitments: commitments.map((c) => c.commitment),
    });
  } catch (error) {
    console.error("[commitments] Error fetching commitments:", error);
    return Response.json(
      { error: "Failed to fetch commitments" },
      { status: 500 }
    );
  }
}
